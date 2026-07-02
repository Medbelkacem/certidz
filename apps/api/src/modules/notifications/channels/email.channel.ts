import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from '@prisma/client';
import type { Env } from '../../../config/env';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ChannelDeliveryResult,
  NotificationChannelAdapter,
  OutboundNotification,
} from './channel.interface';

/**
 * Email channel — working-but-safe stub.
 *
 * When SMTP_URL is unset (dev/test) it logs the message instead of sending,
 * so no external calls happen and nothing leaks. When SMTP_URL is set, the
 * real transport is wired at the marked boundary.
 *
 * NOTE: `nodemailer` is intentionally not imported/instantiated here because
 * it is not yet a declared dependency; adding it is the single prod TODO.
 */
@Injectable()
export class EmailChannel implements NotificationChannelAdapter {
  readonly channel = NotificationChannel.EMAIL;
  private readonly logger = new Logger(EmailChannel.name);
  private readonly smtpUrl?: string;

  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    this.smtpUrl = this.config.get('SMTP_URL', { infer: true });
  }

  async send(message: OutboundNotification): Promise<ChannelDeliveryResult> {
    const to = await this.resolveRecipient(message);
    if (!to) {
      return {
        channel: this.channel,
        delivered: false,
        detail: 'no recipient email',
      };
    }

    if (!this.smtpUrl) {
      // Dev/test: log instead of sending.
      this.logger.log(
        `[email:dev] to=${to} subject="${message.title}" body="${message.body}"`,
      );
      return { channel: this.channel, delivered: true, detail: 'logged (dev)' };
    }

    // TODO(prod): wire real SMTP send, e.g.
    //   import nodemailer from 'nodemailer';
    //   const transport = nodemailer.createTransport(this.smtpUrl);
    //   await transport.sendMail({ from, to, subject: message.title, text: message.body });
    this.logger.warn(
      `[email] SMTP configured but transport not wired (TODO prod); to=${to}`,
    );
    return {
      channel: this.channel,
      delivered: false,
      detail: 'smtp transport not wired',
    };
  }

  private async resolveRecipient(
    message: OutboundNotification,
  ): Promise<string | null> {
    if (message.recipientEmail) {
      return message.recipientEmail;
    }
    const user = await this.prisma.user.findUnique({
      where: { id: message.userId },
      select: { email: true },
    });
    return user?.email ?? null;
  }
}
