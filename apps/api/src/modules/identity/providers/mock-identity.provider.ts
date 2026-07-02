import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  DocumentInput,
  DocumentVerificationResult,
  FaceMatchResult,
  IdentityProviderAdapter,
  LivenessResult,
} from './identity-provider.interface';

/**
 * Deterministic, offline identity provider used in development and tests.
 *
 * Every score is derived from a SHA-256 hash of the input, so the same input
 * always yields the same score (stable tests) while different inputs spread
 * pseudo-uniformly across [0, 1]. NO network calls, NO randomness.
 */
@Injectable()
export class MockIdentityProvider implements IdentityProviderAdapter {
  readonly name = 'mock';

  /** Threshold above which a check is considered a pass. */
  private static readonly PASS_THRESHOLD = 0.5;

  /** Maps an arbitrary string to a stable float in [0, 1). */
  private hashToUnit(salt: string, input: string): number {
    const digest = createHash('sha256').update(`${salt}:${input}`).digest();
    // Use the first 6 bytes (48 bits) for ample resolution.
    let value = 0;
    for (let i = 0; i < 6; i++) {
      value = value * 256 + digest[i];
    }
    return value / 2 ** 48;
  }

  /** Round to 4 decimals so persisted scores are clean. */
  private round(n: number): number {
    return Math.round(n * 10_000) / 10_000;
  }

  private fingerprint(input: DocumentInput): string {
    return [
      input.type,
      input.frontS3Key,
      input.backS3Key ?? '',
      input.selfieS3Key ?? '',
    ].join('|');
  }

  async verifyDocument(
    input: DocumentInput,
  ): Promise<DocumentVerificationResult> {
    const fp = this.fingerprint(input);
    const score = this.round(this.hashToUnit('doc', fp));
    const authentic = score >= MockIdentityProvider.PASS_THRESHOLD;

    const riskFlags: string[] = [];
    if (!authentic) {
      riskFlags.push('DOCUMENT_AUTHENTICITY_LOW');
    }
    // Deterministically flag ~1-in-8 documents as expired for realism.
    if (this.hashToUnit('expiry', fp) < 0.125) {
      riskFlags.push('DOCUMENT_EXPIRED');
    }
    if (input.type === 'DRIVER_LICENSE' && this.hashToUnit('mrz', fp) < 0.1) {
      riskFlags.push('MRZ_MISMATCH');
    }

    return {
      score,
      authentic,
      riskFlags,
      extracted: {
        documentType: input.type,
        // Deterministic pseudo document number, never a real identifier.
        documentNumber: `MOCK-${createHash('sha256')
          .update(fp)
          .digest('hex')
          .slice(0, 10)
          .toUpperCase()}`,
      },
    };
  }

  async matchFace(input: DocumentInput): Promise<FaceMatchResult> {
    const score = this.round(this.hashToUnit('face', this.fingerprint(input)));
    return { score, match: score >= MockIdentityProvider.PASS_THRESHOLD };
  }

  async checkLiveness(input: DocumentInput): Promise<LivenessResult> {
    const score = this.round(
      this.hashToUnit('liveness', this.fingerprint(input)),
    );
    return { score, live: score >= MockIdentityProvider.PASS_THRESHOLD };
  }
}
