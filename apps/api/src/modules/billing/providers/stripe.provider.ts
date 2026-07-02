import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env';
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  PaymentWebhookResult,
} from './payment-provider.interface';

/**
 * Stripe payment provider — SKELETON.
 *
 * Reads STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET from config. The actual
 * Stripe SDK calls are marked with `TODO(prod)` at the network boundary; the
 * `stripe` package is not yet a declared dependency, so it is not imported.
 * Everything else (config wiring, typed contracts) is real.
 */
@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe';
  private readonly logger = new Logger(StripeProvider.name);
  private readonly secretKey?: string;
  private readonly webhookSecret?: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.secretKey = this.config.get('STRIPE_SECRET_KEY', { infer: true });
    this.webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET', {
      infer: true,
    });
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY unset — returning stub checkout');
    }
    // TODO(prod): wire real Stripe SDK call, e.g.
    //   const stripe = new Stripe(this.secretKey);
    //   const session = await stripe.checkout.sessions.create({ ... });
    //   return { url: session.url, ref: session.id };
    const ref = `cs_stub_${request.orgId}_${request.plan}`;
    return {
      url: `${request.successUrl}?stub_session=${ref}`,
      ref,
    };
  }

  async cancelSubscription(providerRef: string): Promise<void> {
    // TODO(prod): await stripe.subscriptions.cancel(providerRef);
    this.logger.log(`[stub] cancel subscription ${providerRef}`);
  }

  async handleWebhook(
    rawBody: string,
    signature: string,
  ): Promise<PaymentWebhookResult> {
    // TODO(prod): verify with stripe.webhooks.constructEvent(rawBody,
    //   signature, this.webhookSecret) then map event.type → result.
    if (!this.webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET unset — ignoring webhook');
      return { type: 'ignored' };
    }
    try {
      const parsed = JSON.parse(rawBody) as { type?: string };
      this.logger.debug(
        `[stub] stripe webhook type=${parsed.type ?? 'unknown'} sig=${signature.slice(0, 8)}…`,
      );
    } catch {
      this.logger.warn('[stub] non-JSON stripe webhook body');
    }
    return { type: 'ignored' };
  }
}
