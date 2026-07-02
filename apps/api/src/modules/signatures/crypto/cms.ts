import * as forge from 'node-forge';

/**
 * Detached PKCS#7 / CMS SignedData primitives (software / dev mode).
 *
 * `signDetached` produces a standards-shaped detached CMS signature over the
 * document bytes with signed attributes (contentType, messageDigest,
 * signingTime). `verifyDetached` re-derives the content digest, checks the
 * messageDigest signed attribute, and verifies the RSA signature over the DER
 * of the signed attributes using the embedded signer certificate's public key.
 *
 * TODO(prod): a qualified signature (QES) requires the signing key to live in
 * an HSM/PKCS#11 token and a PAdES-LTV embedding into the PDF; this software
 * path covers SES/AES-grade dev signing and verification.
 */

export interface CmsSignResult {
  /** Base64-encoded DER of the detached CMS SignedData. */
  cmsBase64: string;
  signingTime: Date;
}

export interface CmsVerifyResult {
  valid: boolean;
  /** Digest of the signed attributes matched the RSA signature. */
  signatureValid: boolean;
  /** The messageDigest signed attribute matched the supplied content. */
  contentDigestValid: boolean;
  signerCertPem?: string;
  signingTime?: Date;
  reason?: string;
}

const MESSAGE_DIGEST_OID = forge.pki.oids.messageDigest;

/** Minimal shape we rely on from a parsed CMS SignedData message. */
interface ParsedSignedData {
  certificates: forge.pki.Certificate[];
  rawCapture: {
    signature: string;
    authenticatedAttributes: forge.asn1.Asn1[];
  };
}

export function signDetached(
  content: Buffer,
  cert: forge.pki.Certificate,
  privateKey: forge.pki.rsa.PrivateKey,
  signingTime: Date = new Date(),
): CmsSignResult {
  const p7 = forge.pkcs7.createSignedData();
  // Content is set so forge computes the messageDigest, but excluded from the
  // output via { detached: true }.
  p7.content = forge.util.createBuffer(content.toString('binary'));
  p7.addCertificate(cert);
  p7.addSigner({
    key: privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      // node-forge encodes signingTime from a Date (UTCTIME/GeneralizedTime).
      { type: forge.pki.oids.signingTime, value: signingTime },
    ],
  });
  p7.sign({ detached: true });

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return { cmsBase64: forge.util.encode64(der), signingTime };
}

export function verifyDetached(
  content: Buffer,
  cmsBase64: string,
): CmsVerifyResult {
  try {
    const der = forge.util.decode64(cmsBase64);
    const asn1 = forge.asn1.fromDer(der);
    const msg = forge.pkcs7.messageFromAsn1(asn1) as unknown as ParsedSignedData;

    const cert = msg.certificates?.[0];
    if (!cert) {
      return failure('CMS contains no signer certificate');
    }
    const signerCertPem = forge.pki.certificateToPem(cert);

    const attrs = msg.rawCapture.authenticatedAttributes;
    if (!attrs || attrs.length === 0) {
      return failure('CMS has no signed attributes');
    }

    // 1) content digest vs. the messageDigest signed attribute.
    const md = forge.md.sha256.create();
    md.update(content.toString('binary'));
    const contentDigest = md.digest().getBytes();
    const messageDigestAttr = extractMessageDigest(attrs);
    const contentDigestValid =
      messageDigestAttr !== undefined && messageDigestAttr === contentDigest;

    // 2) RSA signature over the DER of the signed attributes (as a SET OF).
    const attrSet = forge.asn1.create(
      forge.asn1.Class.UNIVERSAL,
      forge.asn1.Type.SET,
      true,
      attrs,
    );
    const attrDer = forge.asn1.toDer(attrSet).getBytes();
    const attrMd = forge.md.sha256.create();
    attrMd.update(attrDer);
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    const signatureValid = publicKey.verify(
      attrMd.digest().getBytes(),
      msg.rawCapture.signature,
    );

    const signingTime = extractSigningTime(attrs);

    return {
      valid: signatureValid && contentDigestValid,
      signatureValid,
      contentDigestValid,
      signerCertPem,
      signingTime,
      ...(signatureValid && contentDigestValid
        ? {}
        : { reason: 'signature or content digest did not verify' }),
    };
  } catch (err) {
    return failure(`CMS parse/verify error: ${String(err)}`);
  }
}

// --- helpers ---------------------------------------------------------------

function attrOid(attr: forge.asn1.Asn1): string {
  const oidAsn1 = (attr.value as forge.asn1.Asn1[])[0];
  return forge.asn1.derToOid(oidAsn1.value as string);
}

function attrValueBytes(attr: forge.asn1.Asn1): string {
  const set = (attr.value as forge.asn1.Asn1[])[1];
  const inner = (set.value as forge.asn1.Asn1[])[0];
  return inner.value as string;
}

function extractMessageDigest(
  attrs: forge.asn1.Asn1[],
): string | undefined {
  for (const attr of attrs) {
    if (attrOid(attr) === MESSAGE_DIGEST_OID) {
      return attrValueBytes(attr);
    }
  }
  return undefined;
}

function extractSigningTime(attrs: forge.asn1.Asn1[]): Date | undefined {
  for (const attr of attrs) {
    if (attrOid(attr) === forge.pki.oids.signingTime) {
      const raw = attrValueBytes(attr);
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
  }
  return undefined;
}

function failure(reason: string): CmsVerifyResult {
  return {
    valid: false,
    signatureValid: false,
    contentDigestValid: false,
    reason,
  };
}
