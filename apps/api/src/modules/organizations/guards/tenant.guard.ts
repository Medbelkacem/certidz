import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthenticatedRequest } from '../../auth/auth.types';
import type { TenantRequest } from '../organizations.types';

/**
 * Resolves the active membership binding the authenticated user to the org in
 * the `:orgId` route param and attaches it to the request as `membership`.
 * Must run AFTER `JwtAuthGuard` (needs `request.user`) and BEFORE
 * `PermissionsGuard` (which reads the resolved role). Enforces tenant
 * isolation: a user with no active membership in the org is rejected.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & Partial<TenantRequest>>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const orgId = this.extractOrgId(request);
    if (!orgId) {
      throw new ForbiddenException('Missing organization context');
    }

    const membership = await this.prisma.membership.findUnique({
      where: { orgId_userId: { orgId, userId: user.id } },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException(
        'You are not an active member of this organization',
      );
    }

    request.membership = membership;
    return true;
  }

  private extractOrgId(request: AuthenticatedRequest): string | undefined {
    const params = request.params as Record<string, string | undefined>;
    const header = request.headers['x-org-id'];
    return (
      params.orgId ??
      params.organizationId ??
      (typeof header === 'string' ? header : undefined)
    );
  }
}
