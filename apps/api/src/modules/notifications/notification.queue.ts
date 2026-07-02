import type { NotificationChannel } from '@prisma/client';
import type { OutboundNotification } from './channels/channel.interface';

export const NOTIFICATIONS_QUEUE = 'notifications';
export const NOTIFICATION_DISPATCH_JOB = 'dispatch';

export interface NotificationDispatchJob extends OutboundNotification {
  channels: NotificationChannel[];
}
