import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import type { TenantRequest } from '../organizations.types';
import {
  type Permission,
  roleHasAllPermissions,
} from '../permissions';

/**
 * Checks the permissions declared via `@RequirePermission(...)` against the
 * role of the membership resolved by `TenantGuard`. Handlers with no
 * declared permission are allowed (tenant membership alone suffices).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Partial<TenantRequest>>();
    const membership = request.membership;
    if (!membership) {
      throw new ForbiddenException(
        'Organization membership has not been resolved',
      );
    }

    if (!roleHasAllPermissions(membership.role, required)) {
      throw new ForbiddenException(
        `Role ${membership.role} lacks required permission(s): ${required.join(', ')}`,
      );
    }

    return true;
  }
}
