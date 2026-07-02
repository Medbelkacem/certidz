import type { AuditEvent } from '@prisma/client';
import {
  type AuditEventCore,
  canonicalJson,
  computeEventHash,
  GENESIS_HASH,
} from './audit-hash';
import { AuditService } from './audit.service';
import type { PrismaService } from '../../prisma/prisma.service';

describe('audit hash chain', () => {
  const buildCore = (
    seq: number,
    overrides: Partial<AuditEventCore> = {},
  ): AuditEventCore => ({
    chainKey: 'org_1',
    seq,
    actorId: 'user_1',
    actorType: 'user',
    action: `action.${seq}`,
    resourceType: 'document',
    resourceId: `doc_${seq}`,
    ip: '127.0.0.1',
    userAgent: 'jest',
    metadata: { index: seq },
    createdAt: new Date(1700000000000 + seq * 1000).toISOString(),
    ...overrides,
  });

  const coreToEvent = (core: AuditEventCore, prevHash: string): AuditEvent => ({
    id: `evt_${core.seq}`,
    chainKey: core.chainKey,
    seq: core.seq,
    tenantId: core.chainKey,
    actorId: core.actorId,
    actorType: core.actorType,
    action: core.action,
    resourceType: core.resourceType,
    resourceId: core.resourceId,
    ip: core.ip,
    userAgent: core.userAgent,
    metadata: core.metadata as AuditEvent['metadata'],
    prevHash,
    hash: computeEventHash(prevHash, core),
    createdAt: new Date(core.createdAt),
  });

  const buildChain = (length: number): AuditEvent[] => {
    const events: AuditEvent[] = [];
    let prevHash = GENESIS_HASH;
    for (let seq = 1; seq <= length; seq++) {
      const event = coreToEvent(buildCore(seq), prevHash);
      events.push(event);
      prevHash = event.hash;
    }
    return events;
  };

  // verifyEvents is pure — no Prisma needed.
  const service = new AuditService({} as PrismaService);

  describe('canonicalJson', () => {
    it('is stable under key reordering', () => {
      expect(canonicalJson({ b: 1, a: { d: 2, c: [3, { f: 4, e: 5 }] } })).toBe(
        canonicalJson({ a: { c: [3, { e: 5, f: 4 }], d: 2 }, b: 1 }),
      );
    });

    it('preserves array order', () => {
      expect(canonicalJson([2, 1])).not.toBe(canonicalJson([1, 2]));
    });
  });

  describe('computeEventHash', () => {
    it('is deterministic', () => {
      const core = buildCore(1);
      expect(computeEventHash(GENESIS_HASH, core)).toBe(
        computeEventHash(GENESIS_HASH, core),
      );
    });

    it('changes when any covered field changes', () => {
      const base = computeEventHash(GENESIS_HASH, buildCore(1));
      expect(
        computeEventHash(GENESIS_HASH, buildCore(1, { action: 'other' })),
      ).not.toBe(base);
      expect(computeEventHash('not-genesis', buildCore(1))).not.toBe(base);
    });
  });

  describe('verifyEvents', () => {
    it('accepts an empty chain', () => {
      expect(service.verifyEvents([])).toEqual({
        valid: true,
        checkedEvents: 0,
      });
    });

    it('accepts a well-formed chain', () => {
      const chain = buildChain(5);
      expect(service.verifyEvents(chain)).toEqual({
        valid: true,
        checkedEvents: 5,
      });
    });

    it('detects tampering with a historical event payload', () => {
      const chain = buildChain(5);
      chain[2] = { ...chain[2], action: 'evil.rewrite' };

      const result = service.verifyEvents(chain);
      expect(result.valid).toBe(false);
      expect(result.brokenAtId).toBe('evt_3');
      expect(result.reason).toContain('recomputed');
    });

    it('detects a deleted event (sequence gap)', () => {
      const chain = buildChain(5);
      chain.splice(1, 1); // drop seq 2

      const result = service.verifyEvents(chain);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('sequence gap');
    });

    it('detects a re-linked (forged) chain segment', () => {
      const chain = buildChain(4);
      // Attacker rewrites event 2 AND recomputes its hash, but cannot fix
      // event 3's stored prevHash without rewriting the rest of the chain.
      const forgedCore = buildCore(2, { action: 'forged' });
      chain[1] = {
        ...chain[1],
        action: 'forged',
        hash: computeEventHash(chain[0].hash, forgedCore),
      };

      const result = service.verifyEvents(chain);
      expect(result.valid).toBe(false);
      expect(result.brokenAtId).toBe('evt_3');
      expect(result.reason).toContain('prevHash');
    });
  });
});
