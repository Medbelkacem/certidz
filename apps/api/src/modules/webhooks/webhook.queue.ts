export const WEBHOOKS_QUEUE = 'webhooks';
export const WEBHOOK_DELIVER_JOB = 'deliver';

/** Total delivery attempts before a delivery is marked EXHAUSTED. */
export const WEBHOOK_MAX_ATTEMPTS = 5;

export interface WebhookDeliverJob {
  deliveryId: string;
}
