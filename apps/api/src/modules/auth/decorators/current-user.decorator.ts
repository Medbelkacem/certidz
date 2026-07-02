import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthUser } from '../auth.types';

/**
 * Injects the authenticated user (or one of its properties) into a handler:
 *
 *   @Get('me') me(@CurrentUser() user: AuthUser) {}
 *   @Get('id') id(@CurrentUser('id') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (property: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return property ? user?.[property] : user;
  },
);
