import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type AuditEvent } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  type AuditEventCore,
  computeEventHash,
  GENESIS_HASH,
} from './audit-hash';
import type { AuditRecordInput } from './audit.types';

const PLATFORM_CHAIN = 'platform';
const MAX_APPEND_RETRIES = 3;

export interface ChainVerificationResult {
  valid: boolean;
  checkedEvents: number;
  /** First event id where the chain breaks, if any. */
  brokenAtId?: string;
  reason?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only, hash-chained write. Serialization is enforced by the
   * (chainKey, seq) unique constraint: concurrent appends to the same chain
   * conflict and are retried with a freshly read head.
   */
  async append(input: AuditRecordInput): Promise<AuditEvent> {
    const chainKey = input.tenantId ?? PLATFORM_CHAIN;

    for (let attempt = 1; attempt <= MAX_APPEND_RETRIES; attempt++) {
      const head = await this.prisma.auditEvent.findFirst({
        where: { chainKey },
        orderBy: { seq: 'desc' },
        select: { seq: true, hash: true },
      });

      const seq = (head?.seq ?? 0) + 1;
      const prevHash = head?.hash ?? GENESIS_HASH;
      const createdAt = new Date();

      const core: AuditEventCore = {
        chainKey,
        seq,
        actorId: input.actorId ?? null,
        actorType: input.actorType ?? 'user',
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? {},
        createdAt: createdAt.toISOString(),
      };

      const hash = computeEventHash(prevHash, core);

      try {
        return await this.prisma.auditEvent.create({
          data: {
            chainKey,
            seq,
            tenantId: input.tenantId ?? null,
            actorId: core.actorId,
            actorType: core.actorType,
            action: core.action,
            resourceType: core.resourceType,
            resourceId: core.resourceId,
            ip: core.ip,
            userAgent: core.userAgent,
            metadata: (input.metadata ?? {}) as Prisma.InputJsonObject,
            prevHash,
            hash,
            createdAt,
          },
        });
      } catch (err: unknown) {
        // P2002 = unique violation on (chainKey, seq) → another writer won.
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          attempt < MAX_APPEND_RETRIES
        ) {
          continue;
        }
        throw err;
      }
    }
    // Unreachable, but keeps the compiler satisfied.
    throw new Error('audit append failed after retries');
  }

  /** Re-walk an entire chain and verify linkage + recomputed hashes. */
  async verifyChain(tenantId?: string | null): Promise<ChainVerificationResult> {
    const chainKey = tenantId ?? PLATFORM_CHAIN;
    const events = await this.prisma.auditEvent.findMany({
      where: { chainKey },
      orderBy: { seq: 'asc' },
    });
    return this.verifyEvents(events);
  }

  /** Pure verification over an ordered list of events (used by tests). */
  verifyEvents(events: AuditEvent[]): ChainVerificationResult {
    let prevHash = GENESIS_HASH;
    let expectedSeq = 1;

    for (const event of events) {
      if (event.seq !== expectedSeq) {
        return {
          valid: false,
          checkedEvents: events.length,
          brokenAtId: event.id,
          reason: `sequence gap: expected ${expectedSeq}, got ${event.seq}`,
        };
      }
      if (event.prevHash !== prevHash) {
        return {
          valid: false,
          checkedEvents: events.length,
          brokenAtId: event.id,
          reason: 'prevHash does not match previous event hash',
        };
      }
      const core: AuditEventCore = {
        chainKey: event.chainKey,
        seq: event.seq,
        actorId: event.actorId,
        actorType: event.actorType,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        ip: event.ip,
        userAgent: event.userAgent,
        metadata: (event.metadata ?? {}) as Record<string, unknown>,
        createdAt: event.createdAt.toISOString(),
      };
      const recomputed = computeEventHash(prevHash, core);
      if (recomputed !== event.hash) {
        return {
          valid: false,
          checkedEvents: events.length,
          brokenAtId: event.id,
          reason: 'stored hash does not match recomputed hash (tampering?)',
        };
      }
      prevHash = event.hash;
      expectedSeq += 1;
    }

    return { valid: true, checkedEvents: events.length };
  }

  async query(params: {
    tenantId: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    actorId?: string;
    from?: Date;
    to?: Date;
    skip: number;
    take: number;
  }): Promise<{ items: AuditEvent[]; total: number }> {
    const where: Prisma.AuditEventWhereInput = {
      tenantId: params.tenantId,
      ...(params.action ? { action: params.action } : {}),
      ...(params.resourceType ? { resourceType: params.resourceType } : {}),
      ...(params.resourceId ? { resourceId: params.resourceId } : {}),
      ...(params.actorId ? { actorId: params.actorId } : {}),
      ...(params.from || params.to
        ? { createdAt: { gte: params.from, lte: params.to } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { seq: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return { items, total };
  }
}
