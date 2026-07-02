/** Event name used with EventEmitter2 to request an audit append. */
export const AUDIT_RECORD_EVENT = 'audit.record';

/** Payload accepted by AuditService.append / the audit.record event. */
export interface AuditRecordInput {
  /** Organization id; omit for platform-level events (auth, signup…). */
  tenantId?: string | null;
  actorId?: string | null;
  actorType?: 'user' | 'system' | 'api-key';
  /** Dot-separated verb, e.g. "auth.login", "envelope.sent". */
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}
