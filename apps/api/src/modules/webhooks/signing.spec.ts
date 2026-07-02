import { signPayload, verifySignature } from './signing';

describe('webhook signing', () => {
  const secret = 'whsec_test_0123456789abcdef';
  const body = JSON.stringify({ event: 'envelope.completed', id: 'env_1' });
  const now = () => Math.floor(Date.now() / 1000);

  it('produces a sha256-prefixed hex signature', () => {
    const sig = signPayload(secret, body, now());
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('round-trips: a fresh signature verifies', () => {
    const ts = now();
    const sig = signPayload(secret, body, ts);
    expect(verifySignature(secret, body, ts, sig)).toBe(true);
  });

  it('is deterministic for the same inputs', () => {
    const ts = 1_700_000_000;
    expect(signPayload(secret, body, ts)).toBe(signPayload(secret, body, ts));
  });

  it('rejects a tampered body', () => {
    const ts = now();
    const sig = signPayload(secret, body, ts);
    expect(verifySignature(secret, `${body} tampered`, ts, sig)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    const ts = now();
    const sig = signPayload(secret, body, ts);
    expect(verifySignature('whsec_other', body, ts, sig)).toBe(false);
  });

  it('rejects a replayed (stale) timestamp', () => {
    const staleTs = now() - 10_000;
    const sig = signPayload(secret, body, staleTs);
    expect(verifySignature(secret, body, staleTs, sig)).toBe(false);
  });

  it('accepts a stale timestamp when tolerance is disabled', () => {
    const staleTs = now() - 10_000;
    const sig = signPayload(secret, body, staleTs);
    expect(verifySignature(secret, body, staleTs, sig, 0)).toBe(true);
  });

  it('rejects a signature bound to a different timestamp (replay swap)', () => {
    const ts = now();
    const sig = signPayload(secret, body, ts);
    expect(verifySignature(secret, body, ts + 1, sig)).toBe(false);
  });

  it('rejects malformed / wrong-length signatures without throwing', () => {
    const ts = now();
    expect(verifySignature(secret, body, ts, 'sha256=deadbeef')).toBe(false);
    expect(verifySignature(secret, body, ts, '')).toBe(false);
  });
});
