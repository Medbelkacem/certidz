import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions';

/** Reflector key under which required permissions are stored on a handler. */
export const REQUIRE_PERMISSION_KEY = 'certidz:require-permission';

/**
 * Declares the permission(s) a handler requires. Enforced by `PermissionsGuard`
 * against the role resolved by `TenantGuard`. All listed permissions must be
 * satisfied (logical AND).
 *
 *   @RequirePermission(Permission.ENVELOPES_SEND)
 *   @RequirePermission(Permission.DOCUMENTS_READ, Permission.DOCUMENTS_WRITE)
 */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permissions);
