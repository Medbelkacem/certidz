import { createHash } from 'node:crypto';

/** Genesis previous-hash for the first event of every chain. */
export const GENESIS_HASH = 'GENESIS';

/** The fields of an audit event that are covered by the hash chain. */
export interface AuditEventCore {
  chainKey: string;
  seq: number;
  actorId: string | null;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string; // ISO-8601
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Deterministic JSON serialization: object keys sorted lexicographically at
 * every depth, arrays kept in order, no whitespace. Two semantically equal
 * events always produce the same byte string.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value as JsonValue));
}

function sortValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, JsonValue> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, JsonValue>)[key];
      if (v !== undefined) {
        sorted[key] = sortValue(v);
      }
    }
    return sorted;
  }
  return value;
}

/**
 * hash = sha256( prevHash + canonicalJson(core) ), hex-encoded.
 * Chaining prevHash into the digest makes any historical mutation
 * (edit, delete, reorder) detectable by re-walking the chain.
 */
export function computeEventHash(
  prevHash: string,
  core: AuditEventCore,
): string {
  return createHash('sha256')
    .update(prevHash)
    .update(canonicalJson(core))
    .digest('hex');
}
