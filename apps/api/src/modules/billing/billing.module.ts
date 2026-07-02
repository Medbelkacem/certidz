import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { StripeProvider } from './providers/stripe.provider';
import { UsageService } from './usage.service';

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    UsageService,
    StripeProvider,
    // Bind the provider-agnostic token to Stripe.
    { provide: PAYMENT_PROVIDER, useExisting: StripeProvider },
  ],
  exports: [BillingService, UsageService],
})
export class BillingModule {}
