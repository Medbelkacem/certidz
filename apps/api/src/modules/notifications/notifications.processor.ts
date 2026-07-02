import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  NOTIFICATION_CHANNELS,
  type NotificationChannelAdapter,
} from './channels/channel.interface';
import {
  NOTIFICATIONS_QUEUE,
  NOTIFICATION_DISPATCH_JOB,
  type NotificationDispatchJob,
} from './notification.queue';

/**
 * Dispatches queued notifications across every enabled channel. A failure on
 * one channel does not abort the others; BullMQ retries the whole job per the
 * queue's default backoff policy.
 */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly byChannel: Map<string, NotificationChannelAdapter>;

  constructor(
    @Inject(NOTIFICATION_CHANNELS)
    channels: NotificationChannelAdapter[],
  ) {
    super();
    this.byChannel = new Map(channels.map((c) => [c.channel, c]));
  }

  async process(job: Job<NotificationDispatchJob>): Promise<void> {
    if (job.name !== NOTIFICATION_DISPATCH_JOB) {
      return;
    }
    const { channels, ...message } = job.data;
    for (const channel of channels) {
      const adapter = this.byChannel.get(channel);
      if (!adapter) {
        this.logger.warn(`No adapter registered for channel ${channel}`);
        continue;
      }
      try {
        const result = await adapter.send(message);
        this.logger.debug(
          `channel=${channel} delivered=${result.delivered} ${result.detail ?? ''}`,
        );
      } catch (err) {
        this.logger.error(
          `channel=${channel} failed: ${String((err as Error).message)}`,
        );
      }
    }
  }
}
