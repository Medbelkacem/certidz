import type {
  IdentityDocumentType,
  IdentityVerificationMethod,
} from '@prisma/client';

/**
 * DI token for the active identity-verification provider adapter.
 * Bound to {@link MockIdentityProvider} by default; a real KYC vendor
 * (Onfido, Jumio, IDnow…) is swapped in behind the same interface.
 */
export const IDENTITY_PROVIDER_ADAPTER = 'IDENTITY_PROVIDER_ADAPTER';

/** Normalised document-authenticity check result. */
export interface DocumentVerificationResult {
  /** 0..1 authenticity confidence. */
  score: number;
  /** True when the document passes the provider's authenticity threshold. */
  authentic: boolean;
  /** Machine-readable risk codes, e.g. "DOCUMENT_EXPIRED", "MRZ_MISMATCH". */
  riskFlags: string[];
  /** Best-effort OCR extraction (names, doc number, dob, expiry…). */
  extracted: Record<string, string>;
}

/** Normalised face-match (selfie ↔ document portrait) result. */
export interface FaceMatchResult {
  /** 0..1 similarity score. */
  score: number;
  match: boolean;
}

/** Normalised presentation-attack / liveness result. */
export interface LivenessResult {
  /** 0..1 liveness confidence. */
  score: number;
  live: boolean;
}

/** Opaque provider input for a single document. */
export interface DocumentInput {
  type: IdentityDocumentType;
  frontS3Key: string;
  backS3Key?: string;
  selfieS3Key?: string;
}

/**
 * Provider-agnostic identity-verification adapter. All methods are pure
 * with respect to their inputs (no hidden global state) so the mock can be
 * deterministic and every real vendor maps cleanly onto the same contract.
 */
export interface IdentityProviderAdapter {
  /** Provider identifier persisted on the verification row. */
  readonly name: string;

  verifyDocument(input: DocumentInput): Promise<DocumentVerificationResult>;

  matchFace(input: DocumentInput): Promise<FaceMatchResult>;

  checkLiveness(input: DocumentInput): Promise<LivenessResult>;
}

/**
 * Which sub-checks a given verification method requires. Callers use this to
 * decide whether face-match / liveness must be run for a session.
 */
export function checksForMethod(method: IdentityVerificationMethod): {
  face: boolean;
  liveness: boolean;
} {
  switch (method) {
    case 'DOCUMENT_ONLY':
    case 'NFC_CHIP':
      return { face: false, liveness: false };
    case 'DOCUMENT_AND_SELFIE':
      return { face: true, liveness: false };
    case 'DOCUMENT_SELFIE_LIVENESS':
      return { face: true, liveness: true };
    default:
      return { face: false, liveness: false };
  }
}
