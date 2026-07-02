import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Webhook payload signing (HMAC-SHA256).
 *
 * The signature covers `${timestamp}.${body}` so that a captured request
 * cannot be replayed with a different timestamp, and the timestamp is sent in
 * its own header for the receiver to enforce a freshness window.
 *
 * Header format on delivery:
 *   X-CertiDZ-Timestamp: <unix-seconds>
 *   X-CertiDZ-Signature: sha256=<hex>
 */

export const SIGNATURE_HEADER = 'X-CertiDZ-Signature';
export const TIMESTAMP_HEADER = 'X-CertiDZ-Timestamp';

/** Value that goes into the X-CertiDZ-Signature header. */
export function signPayload(
  secret: string,
  body: string,
  timestamp: number | string,
): string {
  const signed = `${timestamp}.${body}`;
  const digest = createHmac('sha256', secret).update(signed).digest('hex');
  return `sha256=${digest}`;
}

/**
 * Constant-time verification of a signature header.
 * Optionally enforces a freshness window (default 5 minutes) to reject
 * replayed deliveries.
 */
export function verifySignature(
  secret: string,
  body: string,
  timestamp: number | string,
  signatureHeader: string,
  toleranceSeconds = 300,
): boolean {
  if (toleranceSeconds > 0) {
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) {
      return false;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - ts) > toleranceSeconds) {
      return false;
    }
  }

  const expected = signPayload(secret, body, timestamp);
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  // Length check first — timingSafeEqual throws on length mismatch.
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
