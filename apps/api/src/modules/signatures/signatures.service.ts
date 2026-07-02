import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CertificateStatus,
  CertificateType,
  KeyAlgorithm,
  Prisma,
  type Signature,
  SignatureType,
  SignerAuthMethod,
} from '@prisma/client';
import * as forge from 'node-forge';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import { CaService } from '../certificates/ca.service';
import { CertificatesService } from '../certificates/certificates.service';
import {
  type DnAttributes,
  formatDn,
  generateRsaKeyPair,
} from '../certificates/pki.util';
import { StorageService } from '../storage/storage.service';
import { signDetached, verifyDetached } from './crypto/cms';
import { hexEqual, sha256Hex } from './crypto/hashing';

export interface SignForSignerParams {
  signerId: string;
  orgId: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export interface VerificationReport {
  signatureId: string;
  /** Recomputed document hash equals the signed hash. */
  documentIntegrityValid: boolean;
  /** CMS signature verified against the signer certificate. */
  cmsSignatureValid: boolean;
  /** Signer certificate chains to the issuing + root CA. */
  chainValid: boolean;
  /** Certificate is not revoked (per OCSP/CRL DB state). */
  notRevoked: boolean;
  /** Overall verdict. */
  valid: boolean;
  serial?: string;
  signingTime?: Date;
  details: string[];
}

/** RFC-3161 timestamp token placeholder — replaced by a real TSA in prod. */
interface DevTimestampToken {
  tsa: 'dev-placeholder';
  hashedMessage: string;
  genTime: string;
}

@Injectable()
export class SignaturesService {
  private readonly logger = new Logger(SignaturesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ca: CaService,
    private readonly certificates: CertificatesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // -------------------------------------------------------------------------
  // Signing
  // -------------------------------------------------------------------------

  /**
   * Hash the document bytes, mint a signing certificate from the dev CA, produce
   * a detached CMS signature and persist a Signature row. Called by the
   * envelopes module when a signer signs.
   */
  async signForSigner(params: SignForSignerParams): Promise<Signature> {
    const signer = await this.prisma.envelopeSigner.findUnique({
      where: { id: params.signerId },
      include: { envelope: { include: { document: true } } },
    });
    if (!signer) {
      throw new NotFoundException('Signer not found');
    }
    const document = signer.envelope.document;

    // 1) Retrieve exact bytes and hash them (SHA-256).
    const bytes = await this.storage.getObject(document.s3Key);
    const signedHash = sha256Hex(bytes);

    // 2) Mint a signing certificate for this signer from the dev CA.
    const subject: DnAttributes = {
      CN: signer.fullName,
      emailAddress: signer.email,
      O: 'CertiDZ Signer',
      C: 'DZ',
    };
    const keys = generateRsaKeyPair(KeyAlgorithm.RSA_2048);
    const leaf = await this.ca.issueEndEntity(keys.publicKey, subject, {
      validityDays: 365,
    });
    const leafCert = forge.pki.certificateFromPem(leaf.certPem);

    const certificate = await this.prisma.certificate.create({
      data: {
        orgId: params.orgId,
        userId: signer.userId,
        type: CertificateType.END_ENTITY,
        subjectDn: formatDn(subject),
        issuerDn: leaf.issuerDn,
        serial: leaf.serial,
        notBefore: leaf.notBefore,
        notAfter: leaf.notAfter,
        status: CertificateStatus.ACTIVE,
        keyAlgorithm: KeyAlgorithm.RSA_2048,
        publicKeyPem: forge.pki.publicKeyToPem(keys.publicKey),
        certPem: leaf.certPem,
        issuerChain: leaf.issuerChainPem,
        fingerprint: leaf.fingerprint,
      },
    });
    this.audit({
      tenantId: params.orgId,
      actorId: params.userId ?? null,
      action: 'certificate.issued',
      resourceType: 'certificate',
      resourceId: certificate.id,
      metadata: { serial: certificate.serial, purpose: 'signing' },
    });

    // 3) Produce the detached CMS signature.
    const cms = signDetached(bytes, leafCert, keys.privateKey as forge.pki.rsa.PrivateKey);

    // 4) Attach a placeholder timestamp token.
    // TODO(prod): request a qualified RFC-3161 timestamp from an accredited TSA.
    const timestampToken = this.buildDevTimestamp(signedHash);

    const ltvData: Prisma.InputJsonObject = {
      signedS3Key: document.s3Key,
      certPem: leaf.certPem,
      issuerChainPem: leaf.issuerChainPem,
    };

    const signature = await this.prisma.signature.create({
      data: {
        signerId: signer.id,
        userId: signer.userId,
        type: this.mapType(signer.authMethod),
        certificateId: certificate.id,
        signedHash,
        cmsSignature: cms.cmsBase64,
        timestampToken,
        ltvData,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });

    this.logger.debug(
      `Signature ${signature.id} applied for signer ${signer.id} (hash ${signedHash.slice(0, 12)}…)`,
    );
    return signature;
  }

  // -------------------------------------------------------------------------
  // Verification
  // -------------------------------------------------------------------------

  /**
   * Full signature verification: recompute the document hash, verify the CMS
   * signature, validate the certificate chain, and check revocation status.
   */
  async verify(signatureId: string): Promise<VerificationReport> {
    const signature = await this.prisma.signature.findUnique({
      where: { id: signatureId },
      include: { certificate: true },
    });
    if (!signature) {
      throw new NotFoundException('Signature not found');
    }

    const details: string[] = [];
    const ltv = (signature.ltvData ?? {}) as {
      signedS3Key?: string;
      certPem?: string;
    };

    // 1) Document integrity — recompute the hash of the exact signed bytes.
    let documentIntegrityValid = false;
    let bytes: Buffer | undefined;
    if (ltv.signedS3Key) {
      try {
        bytes = await this.storage.getObject(ltv.signedS3Key);
        const recomputed = sha256Hex(bytes);
        documentIntegrityValid = hexEqual(recomputed, signature.signedHash);
        details.push(
          documentIntegrityValid
            ? 'Document hash matches the signed hash'
            : 'Document hash MISMATCH — the document changed after signing',
        );
      } catch (err) {
        details.push(`Could not fetch signed bytes: ${String(err)}`);
      }
    } else {
      details.push('No signed object reference stored; integrity unverifiable');
    }

    // 2) CMS signature.
    let cmsSignatureValid = false;
    if (bytes && signature.cmsSignature) {
      const result = verifyDetached(bytes, signature.cmsSignature);
      cmsSignatureValid = result.valid;
      details.push(
        cmsSignatureValid
          ? 'CMS signature verified'
          : `CMS signature invalid: ${result.reason ?? 'unknown'}`,
      );
    } else {
      details.push('No CMS signature or bytes available to verify');
    }

    // 3) Certificate chain.
    let chainValid = false;
    const certPem = signature.certificate?.certPem ?? ltv.certPem;
    if (certPem) {
      chainValid = await this.ca.verifyChain(certPem);
      details.push(
        chainValid
          ? 'Certificate chains to the trusted CA'
          : 'Certificate chain validation FAILED',
      );
    } else {
      details.push('No certificate available for chain validation');
    }

    // 4) Revocation.
    let notRevoked = true;
    const serial = signature.certificate?.serial;
    if (serial) {
      const revoked = await this.certificates.isRevoked(serial);
      notRevoked = !revoked;
      details.push(
        notRevoked
          ? 'Certificate is not revoked'
          : 'Certificate is REVOKED',
      );
    }

    const valid =
      documentIntegrityValid && cmsSignatureValid && chainValid && notRevoked;

    return {
      signatureId,
      documentIntegrityValid,
      cmsSignatureValid,
      chainValid,
      notRevoked,
      valid,
      serial,
      signingTime: signature.createdAt,
      details,
    };
  }

  async getForSigner(signerId: string): Promise<Signature[]> {
    return this.prisma.signature.findMany({
      where: { signerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private mapType(authMethod: SignerAuthMethod): SignatureType {
    switch (authMethod) {
      case SignerAuthMethod.CERTIFICATE:
        return SignatureType.QUALIFIED;
      case SignerAuthMethod.ID_VERIFICATION:
      case SignerAuthMethod.SMS_OTP:
        return SignatureType.ADVANCED;
      default:
        return SignatureType.SIMPLE;
    }
  }

  private buildDevTimestamp(signedHash: string): string {
    const token: DevTimestampToken = {
      tsa: 'dev-placeholder',
      hashedMessage: signedHash,
      genTime: new Date().toISOString(),
    };
    return Buffer.from(JSON.stringify(token), 'utf8').toString('base64');
  }

  private audit(input: AuditRecordInput): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, input);
  }
}
