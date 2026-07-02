import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Request } from 'express';
import { type Observable, tap } from 'rxjs';
import type { AuthUser } from '../auth/auth.types';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from './audit.types';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Automatically records an audit event for every successful mutating
 * request. Feature services still append richer, domain-specific events
 * (e.g. "envelope.sent"); this interceptor guarantees a baseline trail.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();

    if (!MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const routePath =
          (req.route as { path?: string } | undefined)?.path ?? req.path;
        const record: AuditRecordInput = {
          tenantId:
            (req.params?.orgId as string | undefined) ??
            (req.headers['x-org-id'] as string | undefined) ??
            null,
          actorId: req.user?.id ?? null,
          actorType: req.user ? 'user' : 'system',
          action: `http.${req.method.toLowerCase()}`,
          resourceType: 'http-route',
          resourceId: routePath,
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
          metadata: { statusFamily: '2xx' },
        };
        this.eventEmitter.emit(AUDIT_RECORD_EVENT, record);
      }),
    );
  }
}
