import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrgPlan,
  SubscriptionStatus,
  type Invoice,
  type Subscription,
  type UsageRecord,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import type { ChangePlanDto } from './dto/change-plan.dto';
import { PLANS, type PlanDefinition } from './plans';
import {
  PAYMENT_PROVIDER,
  type CheckoutSession,
  type PaymentProvider,
} from './providers/payment-provider.interface';
import { UsageService } from './usage.service';

export interface CurrentSubscription {
  plan: OrgPlan;
  definition: PlanDefinition;
  subscription: Subscription | null;
}

export type ChangePlanResult =
  | { applied: true; plan: OrgPlan }
  | { applied: false; checkout: CheckoutSession };

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
  ) {}

  async getCurrent(orgId: string): Promise<CurrentSubscription> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        orgId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const plan = subscription?.plan ?? org.plan;
    return { plan, definition: PLANS[plan], subscription };
  }

  /**
   * Free plan is applied immediately; paid plans start a checkout session and
   * are only activated once the provider webhook confirms payment.
   */
  async changePlan(
    orgId: string,
    dto: ChangePlanDto,
    ctx: RequestContext & { actorId: string },
  ): Promise<ChangePlanResult> {
    if (dto.plan === OrgPlan.FREE) {
      await this.prisma.organization.update({
        where: { id: orgId },
        data: { plan: OrgPlan.FREE },
      });
      this.audit(orgId, ctx, {
        action: 'billing.plan_changed',
        resourceId: orgId,
        metadata: { plan: OrgPlan.FREE, via: 'immediate' },
      });
      return { applied: true, plan: OrgPlan.FREE };
    }

    const checkout = await this.payments.createCheckout({
      orgId,
      plan: dto.plan,
      successUrl: dto.successUrl ?? 'https://app.certidz.dz/billing/success',
      cancelUrl: dto.cancelUrl ?? 'https://app.certidz.dz/billing/cancel',
    });
    this.audit(orgId, ctx, {
      action: 'billing.checkout_started',
      resourceId: orgId,
      metadata: { plan: dto.plan, provider: this.payments.name },
    });
    return { applied: false, checkout };
  }

  listInvoices(orgId: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Record metered usage after enforcing the plan limit. */
  async recordUsage(
    orgId: string,
    metric: Parameters<UsageService['record']>[1],
    quantity: number,
    ctx: RequestContext & { actorId: string },
  ): Promise<UsageRecord> {
    await this.usage.assertWithinLimit(orgId, metric, quantity);
    const record = await this.usage.record(orgId, metric, quantity);
    this.audit(orgId, ctx, {
      action: 'billing.usage_recorded',
      resourceId: orgId,
      metadata: { metric, quantity },
    });
    return record;
  }

  private audit(
    orgId: string,
    ctx: RequestContext & { actorId: string },
    partial: Pick<AuditRecordInput, 'action' | 'resourceId' | 'metadata'>,
  ): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, {
      tenantId: orgId,
      actorId: ctx.actorId,
      resourceType: 'billing',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      ...partial,
    } satisfies AuditRecordInput);
  }
}
