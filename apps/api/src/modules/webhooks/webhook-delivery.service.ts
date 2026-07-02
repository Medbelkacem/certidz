import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, WebhookDeliveryStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  signPayload,
} from './signing';
import {
  WEBHOOKS_QUEUE,
  WEBHOOK_DELIVER_JOB,
  WEBHOOK_MAX_ATTEMPTS,
} from './webhook.queue';

/** Outcome of a single delivery attempt (drives the processor's retry). */
export interface AttemptOutcome {
  delivered: boolean;
  exhausted: boolean;
  responseCode?: number;
}

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);
  /** Per-attempt request timeout. */
  private static readonly TIMEOUT_MS = 10_000;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WEBHOOKS_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * Fan-out an event to every active webhook subscribed to it. Persists a
   * PENDING {@link WebhookDelivery} per webhook and enqueues a delivery job
   * with exponential backoff configured on the queue.
   */
  async dispatch(
    orgId: string,
    eventName: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { orgId, active: true, events: { has: eventName } },
    });

    for (const webhook of webhooks) {
      const payload = {
        id: `evt_${randomUUID()}`,
        event: eventName,
        createdAt: new Date().toISOString(),
        data,
      };
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          eventName,
          payload: payload as Prisma.InputJsonObject,
          status: WebhookDeliveryStatus.PENDING,
        },
      });
      await this.enqueue(delivery.id);
    }
  }

  /**
   * Perform one delivery attempt. Signs the raw body with the webhook secret
   * (HMAC-SHA256 over `${timestamp}.${body}`), records the result, and reports
   * whether the caller (processor) should retry.
   */
  async attemptDelivery(deliveryId: string): Promise<AttemptOutcome> {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });
    if (!delivery) {
      return { delivered: false, exhausted: true };
    }

    const attempt = delivery.attempts + 1;
    const body = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signPayload(delivery.webhook.secret, body, timestamp);

    let responseCode: number | undefined;
    let responseBody: string | undefined;
    let delivered = false;

    try {
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(),
        WebhookDeliveryService.TIMEOUT_MS,
      );
      try {
        const res = await fetch(delivery.webhook.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'user-agent': 'CertiDZ-Webhooks/1',
            [TIMESTAMP_HEADER]: String(timestamp),
            [SIGNATURE_HEADER]: signature,
            'X-CertiDZ-Event': delivery.eventName,
            'X-CertiDZ-Delivery': delivery.id,
          },
          body,
          signal: controller.signal,
        });
        responseCode = res.status;
        responseBody = (await res.text()).slice(0, 2000);
        delivered = res.ok;
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      responseBody = `request failed: ${String((err as Error).message)}`;
    }

    const exhausted = !delivered && attempt >= WEBHOOK_MAX_ATTEMPTS;
    const status = delivered
      ? WebhookDeliveryStatus.DELIVERED
      : exhausted
        ? WebhookDeliveryStatus.EXHAUSTED
        : WebhookDeliveryStatus.FAILED;

    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status,
        attempts: attempt,
        lastAttemptAt: new Date(),
        responseCode: responseCode ?? null,
        responseBody: responseBody ?? null,
        nextRetryAt:
          delivered || exhausted ? null : this.nextRetryAt(attempt),
      },
    });

    return { delivered, exhausted, responseCode };
  }

  private nextRetryAt(attempt: number): Date {
    // Mirror the queue backoff for observability: 2^attempt seconds.
    return new Date(Date.now() + 2 ** attempt * 1000);
  }

  private async enqueue(deliveryId: string): Promise<void> {
    await this.queue.add(
      WEBHOOK_DELIVER_JOB,
      { deliveryId },
      {
        attempts: WEBHOOK_MAX_ATTEMPTS,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
