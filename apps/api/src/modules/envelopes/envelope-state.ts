import { EnvelopeStatus as PrismaEnvelopeStatus, SignerStatus } from '@prisma/client';

/** Re-exported for local ergonomics; identical to the Prisma enum. */
export type EnvelopeStatus = PrismaEnvelopeStatus;
export const EnvelopeStatus = PrismaEnvelopeStatus;

/**
 * Legal state transitions for an envelope's lifecycle.
 *   DRAFT ─▶ SENT ─▶ IN_PROGRESS ─▶ COMPLETED
 * with DECLINED / VOIDED / EXPIRED reachable as terminal states from any
 * active (non-terminal) state. Terminal states have no outgoing transitions.
 */
export const ENVELOPE_TRANSITIONS: Record<EnvelopeStatus, EnvelopeStatus[]> = {
  [EnvelopeStatus.DRAFT]: [EnvelopeStatus.SENT, EnvelopeStatus.VOIDED],
  [EnvelopeStatus.SENT]: [
    EnvelopeStatus.IN_PROGRESS,
    EnvelopeStatus.COMPLETED,
    EnvelopeStatus.DECLINED,
    EnvelopeStatus.VOIDED,
    EnvelopeStatus.EXPIRED,
  ],
  [EnvelopeStatus.IN_PROGRESS]: [
    EnvelopeStatus.COMPLETED,
    EnvelopeStatus.DECLINED,
    EnvelopeStatus.VOIDED,
    EnvelopeStatus.EXPIRED,
  ],
  [EnvelopeStatus.COMPLETED]: [],
  [EnvelopeStatus.DECLINED]: [],
  [EnvelopeStatus.VOIDED]: [],
  [EnvelopeStatus.EXPIRED]: [],
};

export const TERMINAL_STATUSES: readonly EnvelopeStatus[] = [
  EnvelopeStatus.COMPLETED,
  EnvelopeStatus.DECLINED,
  EnvelopeStatus.VOIDED,
  EnvelopeStatus.EXPIRED,
];

export function isTerminal(status: EnvelopeStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransition(
  from: EnvelopeStatus,
  to: EnvelopeStatus,
): boolean {
  return ENVELOPE_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Illegal-transition error thrown by `assertTransition`. */
export class IllegalEnvelopeTransitionError extends Error {
  constructor(
    readonly from: EnvelopeStatus,
    readonly to: EnvelopeStatus,
  ) {
    super(`Illegal envelope transition: ${from} → ${to}`);
    this.name = 'IllegalEnvelopeTransitionError';
  }
}

export function assertTransition(
  from: EnvelopeStatus,
  to: EnvelopeStatus,
): void {
  if (!canTransition(from, to)) {
    throw new IllegalEnvelopeTransitionError(from, to);
  }
}

// ---------------------------------------------------------------------------
// Signing-order logic
// ---------------------------------------------------------------------------

export type SigningMode = 'SEQUENTIAL' | 'PARALLEL';

/** Minimal signer shape needed to compute actionability. */
export interface ActionableSignerInput {
  id: string;
  order: number;
  status: SignerStatus;
}

/** A signer has finished (positively or negatively) at these statuses. */
export function isSignerComplete(status: SignerStatus): boolean {
  return status === SignerStatus.SIGNED || status === SignerStatus.DECLINED;
}

/**
 * Given the envelope's signers and its signing mode, return the signers who
 * may currently act:
 *  - PARALLEL: every not-yet-completed signer is actionable at once.
 *  - SEQUENTIAL: only the not-yet-completed signers in the lowest outstanding
 *    `order` bucket are actionable; higher orders wait their turn. Multiple
 *    signers sharing the same order act concurrently within that bucket.
 * Returns [] once everyone has completed.
 */
export function actionableSigners<T extends ActionableSignerInput>(
  signers: T[],
  mode: SigningMode,
): T[] {
  const incomplete = signers.filter((s) => !isSignerComplete(s.status));
  if (incomplete.length === 0) {
    return [];
  }
  if (mode === 'PARALLEL') {
    return incomplete;
  }
  const lowestOrder = Math.min(...incomplete.map((s) => s.order));
  return incomplete.filter((s) => s.order === lowestOrder);
}

/** True when a specific signer is currently allowed to act. */
export function isSignerActionable<T extends ActionableSignerInput>(
  signers: T[],
  mode: SigningMode,
  signerId: string,
): boolean {
  return actionableSigners(signers, mode).some((s) => s.id === signerId);
}

/** All signers have positively signed (none declined/outstanding). */
export function allSignersSigned(
  signers: ReadonlyArray<{ status: SignerStatus }>,
): boolean {
  return (
    signers.length > 0 &&
    signers.every((s) => s.status === SignerStatus.SIGNED)
  );
}
