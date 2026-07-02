import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NOTIFICATION_CHANNELS } from './channels/channel.interface';
import { EmailChannel } from './channels/email.channel';
import { InAppChannel } from './channels/in-app.channel';
import { NOTIFICATIONS_QUEUE } from './notification.queue';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    InAppChannel,
    EmailChannel,
    {
      // The set of enabled channel adapters, injected into the processor.
      provide: NOTIFICATION_CHANNELS,
      inject: [InAppChannel, EmailChannel],
      useFactory: (inApp: InAppChannel, email: EmailChannel) => [inApp, email],
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
