import { createHash, timingSafeEqual } from 'node:crypto';

export type Hashable = Buffer | Uint8Array | string;

/** Lowercase hex SHA-256 digest of the given bytes. */
export function sha256Hex(data: Hashable): string {
  return createHash('sha256').update(toBuffer(data)).digest('hex');
}

/** Base64 SHA-256 digest of the given bytes. */
export function sha256Base64(data: Hashable): string {
  return createHash('sha256').update(toBuffer(data)).digest('base64');
}

/** Raw SHA-256 digest bytes. */
export function sha256Bytes(data: Hashable): Buffer {
  return createHash('sha256').update(toBuffer(data)).digest();
}

/** Constant-time comparison of two hex digests of equal length. */
export function hexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function toBuffer(data: Hashable): Buffer {
  if (typeof data === 'string') {
    return Buffer.from(data, 'utf8');
  }
  return Buffer.from(data);
}
