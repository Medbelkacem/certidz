import type { NotificationChannel } from '@prisma/client';

/** DI token for the array of enabled notification channel adapters. */
export const NOTIFICATION_CHANNELS = 'NOTIFICATION_CHANNELS';

/** A single notification to be delivered over one or more channels. */
export interface OutboundNotification {
  userId: string;
  orgId?: string | null;
  title: string;
  body: string;
  /** Deep-link payload: { resourceType, resourceId, url }. */
  data?: Record<string, unknown> | null;
  /** Optional explicit recipient email (falls back to the user's email). */
  recipientEmail?: string | null;
}

export interface ChannelDeliveryResult {
  channel: NotificationChannel;
  delivered: boolean;
  detail?: string;
}

/**
 * Channel adapter contract. Each adapter owns delivery for exactly one
 * {@link NotificationChannel} (in-app persistence, email, SMS…).
 */
export interface NotificationChannelAdapter {
  readonly channel: NotificationChannel;
  send(message: OutboundNotification): Promise<ChannelDeliveryResult>;
}
