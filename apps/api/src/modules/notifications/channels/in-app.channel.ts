import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ChannelDeliveryResult,
  NotificationChannelAdapter,
  OutboundNotification,
} from './channel.interface';

/**
 * In-app channel: persists a {@link Notification} row (channel IN_APP) that
 * the user reads from their notification centre.
 */
@Injectable()
export class InAppChannel implements NotificationChannelAdapter {
  readonly channel = NotificationChannel.IN_APP;

  constructor(private readonly prisma: PrismaService) {}

  async send(message: OutboundNotification): Promise<ChannelDeliveryResult> {
    const row = await this.prisma.notification.create({
      data: {
        userId: message.userId,
        orgId: message.orgId ?? null,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        title: message.title,
        body: message.body,
        data: (message.data ?? undefined) as Prisma.InputJsonValue,
        sentAt: new Date(),
      },
    });
    return {
      channel: this.channel,
      delivered: true,
      detail: `notification ${row.id}`,
    };
  }
}
