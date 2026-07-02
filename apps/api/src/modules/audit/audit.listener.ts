import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from './audit.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from './audit.types';

/**
 * Decouples producers from the audit log: any module can
 * `eventEmitter.emit(AUDIT_RECORD_EVENT, input)` without importing
 * AuditService (no circular module dependencies).
 */
@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  constructor(private readonly auditService: AuditService) {}

  @OnEvent(AUDIT_RECORD_EVENT, { async: true })
  async handleAuditRecord(input: AuditRecordInput): Promise<void> {
    try {
      await this.auditService.append(input);
    } catch (err) {
      // The audit log must never take the request path down, but a failed
      // append is a serious signal worth alerting on.
      this.logger.error(
        `Failed to append audit event ${input.action}: ${String(err)}`,
      );
    }
  }
}
