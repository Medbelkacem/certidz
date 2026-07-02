import type { Membership } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/auth.types';

/**
 * Request shape after `TenantGuard` has resolved and attached the caller's
 * active membership in the org identified by the `:orgId` route param.
 */
export interface TenantRequest extends AuthenticatedRequest {
  membership: Membership;
}
