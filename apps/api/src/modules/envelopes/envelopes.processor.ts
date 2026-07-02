import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Job } from 'bullmq';
import { AUDIT_RECORD_EVENT } from '../audit/audit.types';
import {
  type CheckExpiryJob,
  type EnvelopeJobData,
  ENVELOPES_QUEUE,
  type NotifySignerJob,
  type SendRemindersJob,
} from './envelopes.queue';
import { EnvelopesService } from './envelopes.service';

/**
 * Worker for the `envelopes` queue. Delivery of notifications/reminders is a
 * true external boundary (email/SMS provider) and is left as a TODO(prod)
 * extension point; expiry evaluation is fully implemented against the DB.
 */
@Processor(ENVELOPES_QUEUE)
export class EnvelopesProcessor extends WorkerHost {
  private readonly logger = new Logger(EnvelopesProcessor.name);

  constructor(
    private readonly envelopes: EnvelopesService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<EnvelopeJobData>): Promise<void> {
    switch (job.name) {
      case 'notify-signer':
        return this.handleNotifySigner(job.data as NotifySignerJob);
      case 'send-reminders':
        return this.handleSendReminders(job.data as SendRemindersJob);
      case 'check-expiry':
        return this.handleCheckExpiry(job.data as CheckExpiryJob);
      default:
        this.logger.warn(`Unknown envelope job: ${job.name}`);
    }
  }

  private handleNotifySigner(data: NotifySignerJob): void {
    // TODO(prod): dispatch via the notifications module (email/SMS provider).
    // Dev: record the intent in the audit trail and mark the signer notified.
    this.logger.log(
      `Notify signer ${data.signerId} for envelope ${data.envelopeId}`,
    );
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, {
      tenantId: data.orgId,
      actorType: 'system',
      action: 'envelope.signer_notified',
      resourceType: 'envelope_signer',
      resourceId: data.signerId,
      metadata: { envelopeId: data.envelopeId },
    });
  }

  private async handleSendReminders(data: SendRemindersJob): Promise<void> {
    const outstanding = await this.envelopes.outstandingSigners(data.envelopeId);
    this.logger.log(
      `Envelope ${data.envelopeId}: ${outstanding.length} signer(s) to remind`,
    );
    // TODO(prod): actually send reminders through the notifications provider.
  }

  private async handleCheckExpiry(data: CheckExpiryJob): Promise<void> {
    await this.envelopes.expireIfDue(data.envelopeId);
  }
}
