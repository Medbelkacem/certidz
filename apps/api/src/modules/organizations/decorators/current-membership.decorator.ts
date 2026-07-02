import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Membership } from '@prisma/client';
import type { TenantRequest } from '../organizations.types';

/**
 * Injects the membership resolved by `TenantGuard`:
 *
 *   @Get() list(@CurrentMembership() m: Membership) {}
 *   @Get() role(@CurrentMembership('role') role: MembershipRole) {}
 */
export const CurrentMembership = createParamDecorator(
  (property: keyof Membership | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    const membership = request.membership;
    return property ? membership?.[property] : membership;
  },
);
