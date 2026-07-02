import type { OrgPlan } from '@prisma/client';

/** DI token for the active payment provider. */
export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface CheckoutSession {
  /** Hosted checkout URL the client is redirected to. */
  url: string;
  /** Provider session reference. */
  ref: string;
}

export interface CheckoutRequest {
  orgId: string;
  plan: OrgPlan;
  /** Where the provider redirects on success/cancel. */
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

/** Normalised provider webhook result the billing service can act on. */
export interface PaymentWebhookResult {
  type:
    | 'checkout.completed'
    | 'subscription.updated'
    | 'subscription.cancelled'
    | 'invoice.paid'
    | 'ignored';
  orgId?: string;
  plan?: OrgPlan;
  providerRef?: string;
}

/**
 * Provider-agnostic payments contract. The billing module depends only on
 * this interface; Stripe/other gateways implement it.
 */
export interface PaymentProvider {
  readonly name: string;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  cancelSubscription(providerRef: string): Promise<void>;
  /**
   * Verify + parse a raw provider webhook. `signature` is the provider's
   * signature header used to authenticate the payload.
   */
  handleWebhook(
    rawBody: string,
    signature: string,
  ): Promise<PaymentWebhookResult>;
}
