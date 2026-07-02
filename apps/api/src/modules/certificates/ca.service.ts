import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as forge from 'node-forge';
import type { Env } from '../../config/env';
import { StorageService } from '../storage/storage.service';
import {
  certFingerprint,
  type DnAttributes,
  formatDn,
  generateSerial,
  toForgeAttrs,
} from './pki.util';

interface CaKeyPair {
  cert: forge.pki.Certificate;
  key: forge.pki.PrivateKey;
}

interface CaMaterial {
  root: CaKeyPair;
  issuing: CaKeyPair;
}

export interface IssuedLeaf {
  cert: forge.pki.Certificate;
  certPem: string;
  /** PEM chain up to (excluding) the root — i.e. the issuing CA cert. */
  issuerChainPem: string;
  issuerDn: string;
  serial: string;
  fingerprint: string;
  notBefore: Date;
  notAfter: Date;
}

const STORAGE_KEYS = {
  rootCert: 'pki/dev-ca/root-ca.cert.pem',
  rootKey: 'pki/dev-ca/root-ca.key.pem',
  issuingCert: 'pki/dev-ca/issuing-ca.cert.pem',
  issuingKey: 'pki/dev-ca/issuing-ca.key.pem',
} as const;

const ROOT_VALIDITY_YEARS = 20;
const ISSUING_VALIDITY_YEARS = 10;

/**
 * Software (dev-mode) two-tier PKI: a self-signed Root CA and an Issuing CA
 * signed by it. Material is generated once and persisted to object storage,
 * then reused across restarts. In production this is replaced by an
 * HSM/PKCS#11-backed CA — see TODO(prod) markers.
 */
@Injectable()
export class CaService implements OnModuleInit {
  private readonly logger = new Logger(CaService.name);
  private material: CaMaterial | null = null;
  private initPromise: Promise<CaMaterial> | null = null;

  constructor(
    private readonly storage: StorageService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get('DEV_CA_ENABLED', { infer: true })) {
      // Warm the CA so the first issuance is fast and failures surface early.
      await this.ensureMaterial().catch((err) => {
        this.logger.error(`Dev CA initialization failed: ${String(err)}`);
      });
    }
  }

  /** Issuing CA cert PEM (published as the intermediate for chain building). */
  async getIssuingCertPem(): Promise<string> {
    const { issuing } = await this.ensureMaterial();
    return forge.pki.certificateToPem(issuing.cert);
  }

  /** Root CA cert PEM (trust anchor). */
  async getRootCertPem(): Promise<string> {
    const { root } = await this.ensureMaterial();
    return forge.pki.certificateToPem(root.cert);
  }

  /**
   * Sign an end-entity certificate for the supplied public key + subject,
   * issued by the Issuing CA. Adds standard leaf extensions (digitalSignature,
   * clientAuth/emailProtection, non-CA basic constraints).
   */
  async issueEndEntity(
    publicKey: forge.pki.PublicKey,
    subject: DnAttributes,
    options: { validityDays?: number } = {},
  ): Promise<IssuedLeaf> {
    const { issuing } = await this.ensureMaterial();

    const cert = forge.pki.createCertificate();
    cert.publicKey = publicKey;
    cert.serialNumber = generateSerial();

    const notBefore = new Date();
    const notAfter = new Date(notBefore);
    notAfter.setDate(notAfter.getDate() + (options.validityDays ?? 365));
    cert.validity.notBefore = notBefore;
    cert.validity.notAfter = notAfter;

    cert.setSubject(toForgeAttrs(subject));
    cert.setIssuer(issuing.cert.subject.attributes);
    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      {
        name: 'keyUsage',
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
      },
      { name: 'extKeyUsage', clientAuth: true, emailProtection: true },
      { name: 'subjectKeyIdentifier' },
    ]);

    // TODO(prod): the private key must never leave the HSM; signing happens
    // via PKCS#11. Here we sign in software with the issuing CA key.
    cert.sign(issuing.key as forge.pki.rsa.PrivateKey, forge.md.sha256.create());

    return {
      cert,
      certPem: forge.pki.certificateToPem(cert),
      issuerChainPem: forge.pki.certificateToPem(issuing.cert),
      issuerDn: formatDn(this.attrsToDn(issuing.cert.subject.attributes)),
      serial: cert.serialNumber,
      fingerprint: certFingerprint(cert),
      notBefore,
      notAfter,
    };
  }

  /** Verify a leaf certificate chains up to the Issuing CA and Root. */
  async verifyChain(leafPem: string): Promise<boolean> {
    const { root, issuing } = await this.ensureMaterial();
    try {
      const leaf = forge.pki.certificateFromPem(leafPem);
      const caStore = forge.pki.createCaStore([issuing.cert, root.cert]);
      return forge.pki.verifyCertificateChain(caStore, [leaf, issuing.cert]);
    } catch (err) {
      this.logger.warn(`Chain verification error: ${String(err)}`);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Material bootstrap
  // -------------------------------------------------------------------------

  private ensureMaterial(): Promise<CaMaterial> {
    if (this.material) {
      return Promise.resolve(this.material);
    }
    if (!this.config.get('DEV_CA_ENABLED', { infer: true })) {
      throw new ServiceUnavailableException(
        'Dev CA is disabled; a production HSM-backed CA is required',
      );
    }
    // Single-flight: concurrent callers share one bootstrap.
    this.initPromise ??= this.loadOrGenerate().then((m) => {
      this.material = m;
      this.initPromise = null;
      return m;
    });
    return this.initPromise;
  }

  private async loadOrGenerate(): Promise<CaMaterial> {
    const loaded = await this.tryLoad();
    if (loaded) {
      this.logger.log('Loaded existing dev CA material from storage');
      return loaded;
    }
    this.logger.warn('No dev CA material found — generating a new two-tier CA');
    return this.generateAndPersist();
  }

  private async tryLoad(): Promise<CaMaterial | null> {
    const present = await this.storage.exists(STORAGE_KEYS.rootCert);
    if (!present) {
      return null;
    }
    const [rootCert, rootKey, issuingCert, issuingKey] = await Promise.all([
      this.storage.getObject(STORAGE_KEYS.rootCert),
      this.storage.getObject(STORAGE_KEYS.rootKey),
      this.storage.getObject(STORAGE_KEYS.issuingCert),
      this.storage.getObject(STORAGE_KEYS.issuingKey),
    ]);
    return {
      root: {
        cert: forge.pki.certificateFromPem(rootCert.toString('utf8')),
        key: forge.pki.privateKeyFromPem(rootKey.toString('utf8')),
      },
      issuing: {
        cert: forge.pki.certificateFromPem(issuingCert.toString('utf8')),
        key: forge.pki.privateKeyFromPem(issuingKey.toString('utf8')),
      },
    };
  }

  private async generateAndPersist(): Promise<CaMaterial> {
    const root = this.generateRoot();
    const issuing = this.generateIssuing(root);

    await Promise.all([
      this.storage.putObject(
        STORAGE_KEYS.rootCert,
        forge.pki.certificateToPem(root.cert),
        'application/x-pem-file',
      ),
      // TODO(prod): CA private keys must be HSM-resident and never serialized
      // to object storage. This software persistence is dev-only.
      this.storage.putObject(
        STORAGE_KEYS.rootKey,
        forge.pki.privateKeyToPem(root.key as forge.pki.rsa.PrivateKey),
        'application/x-pem-file',
      ),
      this.storage.putObject(
        STORAGE_KEYS.issuingCert,
        forge.pki.certificateToPem(issuing.cert),
        'application/x-pem-file',
      ),
      this.storage.putObject(
        STORAGE_KEYS.issuingKey,
        forge.pki.privateKeyToPem(issuing.key as forge.pki.rsa.PrivateKey),
        'application/x-pem-file',
      ),
    ]);

    this.logger.log('Generated and persisted new dev CA material');
    return { root, issuing };
  }

  private generateRoot(): CaKeyPair {
    const keys = forge.pki.rsa.generateKeyPair({ bits: 4096 });
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = generateSerial();
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = this.yearsFromNow(ROOT_VALIDITY_YEARS);

    const subject = toForgeAttrs({
      CN: 'CertiDZ Dev Root CA',
      O: 'HISN',
      OU: 'CertiDZ Trust Services',
      C: 'DZ',
    });
    cert.setSubject(subject);
    cert.setIssuer(subject); // self-signed
    cert.setExtensions([
      { name: 'basicConstraints', cA: true, critical: true },
      { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
      { name: 'subjectKeyIdentifier' },
    ]);
    cert.sign(keys.privateKey, forge.md.sha256.create());
    return { cert, key: keys.privateKey };
  }

  private generateIssuing(root: CaKeyPair): CaKeyPair {
    const keys = forge.pki.rsa.generateKeyPair({ bits: 4096 });
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = generateSerial();
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = this.yearsFromNow(ISSUING_VALIDITY_YEARS);

    cert.setSubject(
      toForgeAttrs({
        CN: 'CertiDZ Dev Issuing CA',
        O: 'HISN',
        OU: 'CertiDZ Trust Services',
        C: 'DZ',
      }),
    );
    cert.setIssuer(root.cert.subject.attributes);
    cert.setExtensions([
      { name: 'basicConstraints', cA: true, pathLenConstraint: 0, critical: true },
      { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
      { name: 'subjectKeyIdentifier' },
    ]);
    cert.sign(root.key as forge.pki.rsa.PrivateKey, forge.md.sha256.create());
    return { cert, key: keys.privateKey };
  }

  private yearsFromNow(years: number): Date {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  private attrsToDn(attrs: forge.pki.CertificateField[]): DnAttributes {
    const get = (short: string): string | undefined =>
      attrs.find((a) => a.shortName === short)?.value as string | undefined;
    const getByName = (name: string): string | undefined =>
      attrs.find((a) => a.name === name)?.value as string | undefined;
    return {
      CN: get('CN') ?? '',
      O: get('O'),
      OU: get('OU'),
      C: get('C'),
      ST: get('ST'),
      L: get('L'),
      emailAddress: getByName('emailAddress'),
    };
  }
}
