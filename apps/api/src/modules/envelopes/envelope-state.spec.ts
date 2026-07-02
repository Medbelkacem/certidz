import { SignerStatus } from '@prisma/client';
import {
  actionableSigners,
  allSignersSigned,
  assertTransition,
  canTransition,
  EnvelopeStatus,
  IllegalEnvelopeTransitionError,
  isSignerActionable,
  isTerminal,
} from './envelope-state';

describe('envelope state machine', () => {
  describe('canTransition', () => {
    it('allows the happy path DRAFT→SENT→IN_PROGRESS→COMPLETED', () => {
      expect(canTransition(EnvelopeStatus.DRAFT, EnvelopeStatus.SENT)).toBe(true);
      expect(canTransition(EnvelopeStatus.SENT, EnvelopeStatus.IN_PROGRESS)).toBe(
        true,
      );
      expect(
        canTransition(EnvelopeStatus.IN_PROGRESS, EnvelopeStatus.COMPLETED),
      ).toBe(true);
    });

    it('allows voiding/declining/expiring from active states', () => {
      expect(canTransition(EnvelopeStatus.DRAFT, EnvelopeStatus.VOIDED)).toBe(true);
      expect(canTransition(EnvelopeStatus.SENT, EnvelopeStatus.DECLINED)).toBe(true);
      expect(canTransition(EnvelopeStatus.IN_PROGRESS, EnvelopeStatus.EXPIRED)).toBe(
        true,
      );
    });

    it('rejects skipping and backwards transitions', () => {
      expect(canTransition(EnvelopeStatus.DRAFT, EnvelopeStatus.COMPLETED)).toBe(
        false,
      );
      expect(canTransition(EnvelopeStatus.DRAFT, EnvelopeStatus.IN_PROGRESS)).toBe(
        false,
      );
      expect(canTransition(EnvelopeStatus.COMPLETED, EnvelopeStatus.SENT)).toBe(
        false,
      );
    });

    it('treats terminal states as sinks', () => {
      for (const terminal of [
        EnvelopeStatus.COMPLETED,
        EnvelopeStatus.DECLINED,
        EnvelopeStatus.VOIDED,
        EnvelopeStatus.EXPIRED,
      ]) {
        expect(isTerminal(terminal)).toBe(true);
        expect(canTransition(terminal, EnvelopeStatus.SENT)).toBe(false);
      }
    });
  });

  describe('assertTransition', () => {
    it('is a no-op for legal transitions', () => {
      expect(() =>
        assertTransition(EnvelopeStatus.SENT, EnvelopeStatus.IN_PROGRESS),
      ).not.toThrow();
    });

    it('throws IllegalEnvelopeTransitionError for illegal transitions', () => {
      expect(() =>
        assertTransition(EnvelopeStatus.DRAFT, EnvelopeStatus.COMPLETED),
      ).toThrow(IllegalEnvelopeTransitionError);
    });
  });

  describe('actionableSigners', () => {
    const signers = [
      { id: 'a', order: 1, status: SignerStatus.PENDING },
      { id: 'b', order: 2, status: SignerStatus.PENDING },
      { id: 'c', order: 2, status: SignerStatus.PENDING },
      { id: 'd', order: 3, status: SignerStatus.PENDING },
    ];

    it('SEQUENTIAL: only the lowest outstanding order bucket is actionable', () => {
      const result = actionableSigners(signers, 'SEQUENTIAL');
      expect(result.map((s) => s.id)).toEqual(['a']);
    });

    it('SEQUENTIAL: advances to the next bucket once lower orders complete', () => {
      const afterA = signers.map((s) =>
        s.id === 'a' ? { ...s, status: SignerStatus.SIGNED } : s,
      );
      // Order 2 has TWO signers → both become actionable concurrently.
      const result = actionableSigners(afterA, 'SEQUENTIAL');
      expect(result.map((s) => s.id).sort()).toEqual(['b', 'c']);
    });

    it('SEQUENTIAL: a DECLINED signer counts as complete and unblocks its bucket', () => {
      const afterA = signers.map((s) =>
        s.id === 'a' ? { ...s, status: SignerStatus.DECLINED } : s,
      );
      const result = actionableSigners(afterA, 'SEQUENTIAL');
      expect(result.map((s) => s.id).sort()).toEqual(['b', 'c']);
    });

    it('PARALLEL: every incomplete signer is actionable at once', () => {
      const result = actionableSigners(signers, 'PARALLEL');
      expect(result.map((s) => s.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('returns [] when all signers are complete', () => {
      const done = signers.map((s) => ({ ...s, status: SignerStatus.SIGNED }));
      expect(actionableSigners(done, 'SEQUENTIAL')).toEqual([]);
      expect(actionableSigners(done, 'PARALLEL')).toEqual([]);
    });

    it('isSignerActionable respects the mode', () => {
      expect(isSignerActionable(signers, 'SEQUENTIAL', 'd')).toBe(false);
      expect(isSignerActionable(signers, 'PARALLEL', 'd')).toBe(true);
    });
  });

  describe('allSignersSigned', () => {
    it('is true only when every signer has SIGNED', () => {
      expect(
        allSignersSigned([
          { status: SignerStatus.SIGNED },
          { status: SignerStatus.SIGNED },
        ]),
      ).toBe(true);
      expect(
        allSignersSigned([
          { status: SignerStatus.SIGNED },
          { status: SignerStatus.DECLINED },
        ]),
      ).toBe(false);
      expect(allSignersSigned([])).toBe(false);
    });
  });
});
