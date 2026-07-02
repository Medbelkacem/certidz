import { randomBytes } from 'node:crypto';
import * as forge from 'node-forge';
import { KeyAlgorithm } from '@prisma/client';

/** Distinguished-name attribute pairs, e.g. { CN: 'Amina Benali', C: 'DZ' }. */
export interface DnAttributes {
  CN: string;
  O?: string;
  OU?: string;
  C?: string;
  ST?: string;
  L?: string;
  emailAddress?: string;
}

const SHORT_NAME_ORDER: (keyof DnAttributes)[] = [
  'CN',
  'OU',
  'O',
  'L',
  'ST',
  'C',
  'emailAddress',
];

/** Render a DN attribute map to a stable RFC-4514-ish string for storage. */
export function formatDn(attrs: DnAttributes): string {
  return SHORT_NAME_ORDER.filter((k) => attrs[k] != null && attrs[k] !== '')
    .map((k) => `${k}=${attrs[k]}`)
    .join(', ');
}

/** Convert a DN map into node-forge subject/issuer attribute arrays. */
export function toForgeAttrs(
  attrs: DnAttributes,
): forge.pki.CertificateField[] {
  const out: forge.pki.CertificateField[] = [];
  if (attrs.CN) out.push({ shortName: 'CN', value: attrs.CN });
  if (attrs.O) out.push({ shortName: 'O', value: attrs.O });
  if (attrs.OU) out.push({ shortName: 'OU', value: attrs.OU });
  if (attrs.C) out.push({ shortName: 'C', value: attrs.C });
  if (attrs.ST) out.push({ shortName: 'ST', value: attrs.ST });
  if (attrs.L) out.push({ shortName: 'L', value: attrs.L });
  if (attrs.emailAddress)
    out.push({ name: 'emailAddress', value: attrs.emailAddress });
  return out;
}

/** Cryptographically-random positive serial as a hex string (no leading 0x). */
export function generateSerial(): string {
  // 16 random bytes; force the high bit clear so the ASN.1 INTEGER is positive.
  const bytes = randomBytes(16);
  bytes[0] = bytes[0] & 0x7f;
  const hex = bytes.toString('hex').replace(/^0+/, '');
  return hex === '' ? '01' : hex;
}

/** SHA-256 fingerprint (hex) of a certificate's DER encoding. */
export function certFingerprint(cert: forge.pki.Certificate): string {
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const md = forge.md.sha256.create();
  md.update(der);
  return md.digest().toHex();
}

/** Bit length for RSA key algorithms; EC is not supported by the dev CA yet. */
export function rsaBitsFor(algorithm: KeyAlgorithm): number {
  switch (algorithm) {
    case KeyAlgorithm.RSA_2048:
      return 2048;
    case KeyAlgorithm.RSA_4096:
      return 4096;
    default:
      // TODO(prod): EC_P256 / EC_P384 issuance requires an EC-capable signer
      // (HSM/PKCS#11). node-forge's software RSA path does not cover them.
      throw new Error(
        `Key algorithm ${algorithm} is not supported by the software dev CA`,
      );
  }
}

export function generateRsaKeyPair(
  algorithm: KeyAlgorithm,
): forge.pki.rsa.KeyPair {
  return forge.pki.rsa.generateKeyPair({ bits: rsaBitsFor(algorithm) });
}

/** Extract a DnAttributes map from node-forge subject/issuer attribute arrays. */
export function forgeAttrsToDn(
  attrs: forge.pki.CertificateField[],
): DnAttributes {
  const byShort = (short: string): string | undefined =>
    attrs.find((a) => a.shortName === short)?.value as string | undefined;
  const byName = (name: string): string | undefined =>
    attrs.find((a) => a.name === name)?.value as string | undefined;
  return {
    CN: byShort('CN') ?? '',
    O: byShort('O'),
    OU: byShort('OU'),
    C: byShort('C'),
    ST: byShort('ST'),
    L: byShort('L'),
    emailAddress: byName('emailAddress'),
  };
}
