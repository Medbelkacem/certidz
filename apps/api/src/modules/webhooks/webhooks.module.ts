import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookProcessor } from './webhook.processor';
import { WEBHOOKS_QUEUE } from './webhook.queue';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [BullModule.registerQueue({ name: WEBHOOKS_QUEUE })],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDeliveryService, WebhookProcessor],
  // Exported so other modules can fan-out domain events to subscribers.
  exports: [WebhooksService, WebhookDeliveryService],
})
export class WebhooksModule {}
