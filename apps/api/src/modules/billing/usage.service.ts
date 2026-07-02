import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrgPlan,
  SubscriptionStatus,
  type UsageMetric,
  type UsageRecord,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UNLIMITED, limitForMetric } from './plans';

export interface UsageStatus {
  metric: UsageMetric;
  used: number;
  limit: number | null;
  remaining: number | null;
  withinLimit: boolean;
}

/** Inclusive start / exclusive end of the current calendar-month period. */
function currentPeriod(now = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve the effective plan: active subscription first, else org.plan. */
  async resolvePlan(orgId: string): Promise<OrgPlan> {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        orgId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { plan: true },
    });
    if (sub) {
      return sub.plan;
    }
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org.plan;
  }

  /** Current-period usage total for a metric. */
  async getUsed(orgId: string, metric: UsageMetric): Promise<number> {
    const { start } = currentPeriod();
    const record = await this.prisma.usageRecord.findUnique({
      where: {
        orgId_metric_periodStart: { orgId, metric, periodStart: start },
      },
      select: { quantity: true },
    });
    return record?.quantity ?? 0;
  }

  async getStatus(orgId: string, metric: UsageMetric): Promise<UsageStatus> {
    const plan = await this.resolvePlan(orgId);
    const limit = limitForMetric(plan, metric);
    const used = await this.getUsed(orgId, metric);
    const unlimited = limit === null || limit === UNLIMITED;
    return {
      metric,
      used,
      limit: unlimited ? null : limit,
      remaining: unlimited ? null : Math.max(0, limit - used),
      withinLimit: unlimited || used < limit,
    };
  }

  /**
   * Throw 403 when applying `increment` to the metric would exceed the plan
   * limit. Unmetered metrics / unlimited plans always pass.
   */
  async assertWithinLimit(
    orgId: string,
    metric: UsageMetric,
    increment = 1,
  ): Promise<void> {
    const plan = await this.resolvePlan(orgId);
    const limit = limitForMetric(plan, metric);
    if (limit === null || limit === UNLIMITED) {
      return;
    }
    const used = await this.getUsed(orgId, metric);
    if (used + increment > limit) {
      throw new ForbiddenException(
        `Plan limit reached for ${metric}: ${used}/${limit} on ${PLANS_NAME(plan)}. Upgrade to continue.`,
      );
    }
  }

  /**
   * Record usage against the current period (idempotent per period via the
   * (orgId, metric, periodStart) unique key — increments the running total).
   */
  async record(
    orgId: string,
    metric: UsageMetric,
    quantity: number,
  ): Promise<UsageRecord> {
    const { start, end } = currentPeriod();
    return this.prisma.usageRecord.upsert({
      where: {
        orgId_metric_periodStart: { orgId, metric, periodStart: start },
      },
      create: {
        orgId,
        metric,
        quantity,
        periodStart: start,
        periodEnd: end,
      },
      update: { quantity: { increment: quantity } },
    });
  }
}

function PLANS_NAME(plan: OrgPlan): string {
  return plan.charAt(0) + plan.slice(1).toLowerCase();
}
