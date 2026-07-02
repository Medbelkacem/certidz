import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  type Notification,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import type { OutboundNotification } from './channels/channel.interface';
import {
  NOTIFICATIONS_QUEUE,
  NOTIFICATION_DISPATCH_JOB,
  type NotificationDispatchJob,
} from './notification.queue';

export interface NotifyInput extends OutboundNotification {
  /** Defaults to [IN_APP] when omitted. */
  channels?: NotificationChannel[];
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * Queue a notification for asynchronous fan-out across the requested
   * channels. Delivery itself happens in the queue processor.
   */
  async notify(input: NotifyInput): Promise<void> {
    const channels = input.channels?.length
      ? input.channels
      : [NotificationChannel.IN_APP];
    const job: NotificationDispatchJob = {
      userId: input.userId,
      orgId: input.orgId ?? null,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
      recipientEmail: input.recipientEmail ?? null,
      channels,
    };
    await this.queue.add(NOTIFICATION_DISPATCH_JOB, job);
  }

  // -------------------------------------------------------------------------
  // Read API (in-app notification centre)
  // -------------------------------------------------------------------------

  listMine(
    userId: string,
    opts: { unreadOnly?: boolean; skip: number; take: number },
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        ...(opts.unreadOnly ? { status: { not: NotificationStatus.READ } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: opts.skip,
      take: opts.take,
    });
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: { not: NotificationStatus.READ },
      },
    });
  }

  async markRead(userId: string, id: string): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
    return { updated: res.count };
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: { not: NotificationStatus.READ },
      },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
    return { updated: res.count };
  }
}
