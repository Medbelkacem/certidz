import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  type Certificate,
  CertificateStatus,
  CertificateType,
  KeyAlgorithm,
  Prisma,
  RevocationReason,
} from '@prisma/client';
import * as forge from 'node-forge';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import type { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate, type Paginated } from '../../common/dto/pagination.dto';
import { CaService } from './ca.service';
import type { GenerateCertificateDto } from './dto/generate-certificate.dto';
import type { IssueFromCsrDto } from './dto/issue-from-csr.dto';
import {
  type DnAttributes,
  formatDn,
  forgeAttrsToDn,
  generateRsaKeyPair,
} from './pki.util';

/** OCSP-style status for a single certificate. */
export interface CertStatusResponse {
  serial: string;
  status: 'good' | 'revoked' | 'unknown';
  revokedAt?: Date;
  reason?: RevocationReason;
  producedAt: Date;
}

/** Minimal CRL projection: the revoked serials for a tenant. */
export interface CrlResponse {
  producedAt: Date;
  issuer: string;
  revoked: { serial: string; revokedAt: Date; reason: RevocationReason }[];
}

export interface IssuedCertificateResult {
  certificate: Certificate;
  /** Returned ONLY for server-side key generation (dev). Never persisted. */
  privateKeyPem?: string;
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ca: CaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // -------------------------------------------------------------------------
  // Issuance
  // -------------------------------------------------------------------------

  /** Issue an end-entity certificate from a client-supplied PKCS#10 CSR. */
  async issueFromCsr(
    orgId: string,
    userId: string,
    dto: IssueFromCsrDto,
    ctx: RequestContext,
  ): Promise<IssuedCertificateResult> {
    let csr: forge.pki.CertificationRequest;
    try {
      csr = forge.pki.certificationRequestFromPem(dto.csrPem);
    } catch {
      throw new BadRequestException('Invalid CSR PEM');
    }
    if (!csr.publicKey) {
      throw new BadRequestException('CSR is missing a public key');
    }
    // Proof-of-possession: the CSR must be self-signed by the requester's key.
    if (!csr.verify()) {
      throw new BadRequestException('CSR signature verification failed');
    }

    const subject = forgeAttrsToDn(csr.subject.attributes);
    if (!subject.CN) {
      throw new BadRequestException('CSR subject must include a common name');
    }

    const certificate = await this.persistIssued(
      orgId,
      userId,
      csr.publicKey,
      subject,
      dto.keyAlgorithm ?? KeyAlgorithm.RSA_2048,
      dto.validityDays,
      ctx,
    );
    return { certificate };
  }

  /**
   * Dev-mode convenience: generate a keypair server-side, issue a leaf and
   * return the private key exactly once. TODO(prod): disable in favor of CSR.
   */
  async generateAndIssue(
    orgId: string,
    userId: string,
    dto: GenerateCertificateDto,
    ctx: RequestContext,
  ): Promise<IssuedCertificateResult> {
    const algorithm = dto.keyAlgorithm ?? KeyAlgorithm.RSA_2048;
    const keys = generateRsaKeyPair(algorithm);
    const subject: DnAttributes = {
      CN: dto.commonName,
      O: dto.organization,
      OU: dto.organizationalUnit,
      C: dto.country ?? 'DZ',
      emailAddress: dto.email,
    };

    const certificate = await this.persistIssued(
      orgId,
      userId,
      keys.publicKey,
      subject,
      algorithm,
      dto.validityDays,
      ctx,
    );
    return {
      certificate,
      privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    };
  }

  private async persistIssued(
    orgId: string,
    userId: string,
    publicKey: forge.pki.PublicKey,
    subject: DnAttributes,
    keyAlgorithm: KeyAlgorithm,
    validityDays: number | undefined,
    ctx: RequestContext,
  ): Promise<Certificate> {
    const leaf = await this.ca.issueEndEntity(publicKey, subject, {
      validityDays,
    });

    const certificate = await this.prisma.certificate.create({
      data: {
        orgId,
        userId,
        type: CertificateType.END_ENTITY,
        subjectDn: formatDn(subject),
        issuerDn: leaf.issuerDn,
        serial: leaf.serial,
        notBefore: leaf.notBefore,
        notAfter: leaf.notAfter,
        status: CertificateStatus.ACTIVE,
        keyAlgorithm,
        publicKeyPem: forge.pki.publicKeyToPem(publicKey as forge.pki.rsa.PublicKey),
        certPem: leaf.certPem,
        issuerChain: leaf.issuerChainPem,
        fingerprint: leaf.fingerprint,
      },
    });

    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'certificate.issued',
      resourceType: 'certificate',
      resourceId: certificate.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { serial: certificate.serial, subjectDn: certificate.subjectDn },
    });

    return certificate;
  }

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  async list(
    orgId: string,
    pagination: PaginationDto,
  ): Promise<Paginated<Certificate>> {
    const where: Prisma.CertificateWhereInput = { orgId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.certificate.count({ where }),
    ]);
    return paginate(items, total, pagination);
  }

  async getOne(orgId: string, id: string): Promise<Certificate> {
    const cert = await this.prisma.certificate.findFirst({
      where: { id, orgId },
      include: { revocation: true },
    });
    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }
    return cert;
  }

  // -------------------------------------------------------------------------
  // Revocation
  // -------------------------------------------------------------------------

  async revoke(
    orgId: string,
    id: string,
    reason: RevocationReason,
    revokedById: string,
    ctx: RequestContext,
  ): Promise<Certificate> {
    const cert = await this.prisma.certificate.findFirst({
      where: { id, orgId },
      include: { revocation: true },
    });
    if (!cert) {
      throw new NotFoundException('Certificate not found');
    }
    if (cert.status === CertificateStatus.REVOKED) {
      throw new BadRequestException('Certificate is already revoked');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.revocationEntry.create({
        data: {
          certificateId: cert.id,
          serial: cert.serial,
          reason,
          revokedById,
        },
      });
      return tx.certificate.update({
        where: { id: cert.id },
        data: { status: CertificateStatus.REVOKED },
      });
    });

    this.audit({
      tenantId: orgId,
      actorId: revokedById,
      action: 'certificate.revoked',
      resourceType: 'certificate',
      resourceId: cert.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { serial: cert.serial, reason },
    });

    return updated;
  }

  /**
   * OCSP-style single-cert status, reflecting real DB revocation state.
   * TODO(prod): serve a signed RFC-6960 OCSP response from a delegated
   * responder certificate instead of this JSON projection.
   */
  async getStatus(serial: string): Promise<CertStatusResponse> {
    const cert = await this.prisma.certificate.findUnique({
      where: { serial },
      include: { revocation: true },
    });
    const producedAt = new Date();
    if (!cert) {
      return { serial, status: 'unknown', producedAt };
    }
    if (cert.status === CertificateStatus.REVOKED || cert.revocation) {
      return {
        serial,
        status: 'revoked',
        revokedAt: cert.revocation?.revokedAt,
        reason: cert.revocation?.reason,
        producedAt,
      };
    }
    if (cert.notAfter < producedAt) {
      return { serial, status: 'unknown', producedAt };
    }
    return { serial, status: 'good', producedAt };
  }

  /** True when the serial is currently revoked — used by signature verify. */
  async isRevoked(serial: string): Promise<boolean> {
    const status = await this.getStatus(serial);
    return status.status === 'revoked';
  }

  /**
   * CRL projection reflecting DB state.
   * TODO(prod): emit a signed X.509 CRL (DER) with proper thisUpdate/
   * nextUpdate and distribution point wiring.
   */
  async getCrl(orgId: string): Promise<CrlResponse> {
    const revoked = await this.prisma.revocationEntry.findMany({
      where: { certificate: { orgId } },
      orderBy: { revokedAt: 'desc' },
      select: { serial: true, revokedAt: true, reason: true },
    });
    return {
      producedAt: new Date(),
      issuer: 'CN=CertiDZ Dev Issuing CA, O=HISN, C=DZ',
      revoked,
    };
  }

  private audit(input: AuditRecordInput): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, input);
  }
}
