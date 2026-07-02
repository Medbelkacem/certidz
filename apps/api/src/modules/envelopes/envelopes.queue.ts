/** BullMQ queue name for envelope async work (notifications, reminders, expiry). */
export const ENVELOPES_QUEUE = 'envelopes';

export type EnvelopeJobName =
  | 'notify-signer'
  | 'send-reminders'
  | 'check-expiry';

/** Enqueue a notification to a specific signer that it is their turn. */
export interface NotifySignerJob {
  envelopeId: string;
  signerId: string;
  orgId: string;
}

/** Periodic reminder sweep for outstanding signers on an envelope. */
export interface SendRemindersJob {
  envelopeId: string;
  orgId: string;
}

/** Expiry evaluation for an envelope past its `expiresAt`. */
export interface CheckExpiryJob {
  envelopeId: string;
  orgId: string;
}

export type EnvelopeJobData =
  | NotifySignerJob
  | SendRemindersJob
  | CheckExpiryJob;
