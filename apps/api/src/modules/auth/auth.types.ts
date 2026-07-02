import type { Request } from 'express';

/** Claims carried by CertiDZ access tokens. */
export interface JwtPayload {
  /** User id */
  sub: string;
  email: string;
  /** Session id — lets us invalidate access on session revocation */
  sid: string;
}

/** Shape attached to `request.user` after JWT validation. */
export interface AuthUser {
  id: string;
  email: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

/** Per-request client context, used for sessions + audit. */
export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  /** Opaque, single-use refresh token (rotated on every refresh). */
  refreshToken: string;
}
