import { OrgPlan, UsageMetric } from '@prisma/client';

/** Sentinel for an unmetered / unlimited allowance. */
export const UNLIMITED = -1;

export interface PlanLimits {
  /** Included seats (billable members). */
  seats: number;
  /** Envelopes (signature requests) per billing month. */
  envelopesPerMonth: number;
  /** Lifetime issued end-entity certificates. */
  certificates: number;
  /** AI credits (tokens) per billing month. */
  aiCredits: number;
}

export interface PlanDefinition {
  plan: OrgPlan;
  name: string;
  /** Monthly price in minor units (centimes, DZD). */
  priceMinor: number;
  limits: PlanLimits;
}

/** Canonical plan catalogue. `UNLIMITED` (-1) disables a given limit. */
export const PLANS: Record<OrgPlan, PlanDefinition> = {
  [OrgPlan.FREE]: {
    plan: OrgPlan.FREE,
    name: 'Free',
    priceMinor: 0,
    limits: {
      seats: 2,
      envelopesPerMonth: 10,
      certificates: 1,
      aiCredits: 10_000,
    },
  },
  [OrgPlan.PRO]: {
    plan: OrgPlan.PRO,
    name: 'Pro',
    priceMinor: 450_000, // 4 500 DZD
    limits: {
      seats: 10,
      envelopesPerMonth: 250,
      certificates: 25,
      aiCredits: 500_000,
    },
  },
  [OrgPlan.BUSINESS]: {
    plan: OrgPlan.BUSINESS,
    name: 'Business',
    priceMinor: 1_500_000, // 15 000 DZD
    limits: {
      seats: 50,
      envelopesPerMonth: 2_000,
      certificates: 250,
      aiCredits: 5_000_000,
    },
  },
  [OrgPlan.ENTERPRISE]: {
    plan: OrgPlan.ENTERPRISE,
    name: 'Enterprise',
    priceMinor: 0, // custom / contract-billed
    limits: {
      seats: UNLIMITED,
      envelopesPerMonth: UNLIMITED,
      certificates: UNLIMITED,
      aiCredits: UNLIMITED,
    },
  },
};

/** Map a usage metric onto the plan limit that governs it (if any). */
export function limitForMetric(
  plan: OrgPlan,
  metric: UsageMetric,
): number | null {
  const limits = PLANS[plan].limits;
  switch (metric) {
    case UsageMetric.ENVELOPES_SENT:
      return limits.envelopesPerMonth;
    case UsageMetric.AI_TOKENS:
      return limits.aiCredits;
    case UsageMetric.SEATS:
      return limits.seats;
    // Not gated by a hard plan limit in this catalogue.
    case UsageMetric.DOCUMENTS_STORED_MB:
    case UsageMetric.API_CALLS:
    case UsageMetric.IDENTITY_VERIFICATIONS:
      return null;
    default:
      return null;
  }
}
