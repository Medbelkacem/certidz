import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { WebhookDeliveryService } from './webhook-delivery.service';
import {
  WEBHOOKS_QUEUE,
  WEBHOOK_DELIVER_JOB,
  type WebhookDeliverJob,
} from './webhook.queue';

/**
 * Delivers webhook payloads. On a non-final failure it throws so BullMQ
 * re-schedules the job with exponential backoff; once attempts are exhausted
 * the delivery row is marked EXHAUSTED and the job succeeds (no more retries).
 */
@Processor(WEBHOOKS_QUEUE)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly delivery: WebhookDeliveryService) {
    super();
  }

  async process(job: Job<WebhookDeliverJob>): Promise<void> {
    if (job.name !== WEBHOOK_DELIVER_JOB) {
      return;
    }
    const outcome = await this.delivery.attemptDelivery(job.data.deliveryId);
    if (outcome.delivered) {
      this.logger.debug(
        `delivery ${job.data.deliveryId} ok (${outcome.responseCode})`,
      );
      return;
    }
    if (outcome.exhausted) {
      this.logger.warn(
        `delivery ${job.data.deliveryId} exhausted after ${job.attemptsMade + 1} attempts`,
      );
      return; // stop retrying
    }
    // Trigger BullMQ's backoff-driven retry.
    throw new Error(
      `webhook delivery ${job.data.deliveryId} failed (code ${outcome.responseCode ?? 'n/a'})`,
    );
  }
}
