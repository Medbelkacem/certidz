import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  type Membership,
  MembershipRole,
  MembershipStatus,
  type Organization,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import type { CreateOrganizationDto } from './dto/create-organization.dto';
import type { UpdateOrganizationDto } from './dto/update-organization.dto';
import type { InviteMemberDto } from './dto/invite-member.dto';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { ROLE_RANK } from './permissions';

export interface AcceptedInvite {
  membership: Membership;
  organization: Organization;
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // -------------------------------------------------------------------------
  // Authorization helpers (pure — unit tested)
  // -------------------------------------------------------------------------

  /**
   * Role-change authorization. An actor may set a member's role only when:
   *  - the actor outranks both the target's current role and the desired role
   *    (you cannot touch a peer/superior, nor grant a role above your own), OR
   *  - the actor is an OWNER (owners can assign any role, including OWNER).
   * Nobody but an OWNER may create another OWNER.
   */
  static canAssignRole(
    actorRole: MembershipRole,
    targetCurrentRole: MembershipRole,
    desiredRole: MembershipRole,
  ): boolean {
    if (actorRole === MembershipRole.OWNER) {
      return true;
    }
    // Only owners may mint owners.
    if (desiredRole === MembershipRole.OWNER) {
      return false;
    }
    const actorRank = ROLE_RANK[actorRole];
    return (
      actorRank > ROLE_RANK[targetCurrentRole] &&
      actorRank > ROLE_RANK[desiredRole]
    );
  }

  // -------------------------------------------------------------------------
  // Org CRUD
  // -------------------------------------------------------------------------

  async create(
    dto: CreateOrganizationDto,
    userId: string,
    ctx: RequestContext,
  ): Promise<Organization> {
    const slug = this.slugify(dto.slug ?? dto.name);

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('An organization with this slug already exists');
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        country: dto.country ?? 'DZ',
        memberships: {
          create: {
            userId,
            role: MembershipRole.OWNER,
            status: MembershipStatus.ACTIVE,
            acceptedAt: new Date(),
          },
        },
      },
    });

    this.audit({
      tenantId: org.id,
      actorId: userId,
      action: 'org.created',
      resourceType: 'organization',
      resourceId: org.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { slug },
    });

    return org;
  }

  async findOne(orgId: string): Promise<Organization> {
    const org = await this.prisma.organization.findFirst({
      where: { id: orgId, deletedAt: null },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async update(
    orgId: string,
    dto: UpdateOrganizationDto,
    userId: string,
    ctx: RequestContext,
  ): Promise<Organization> {
    await this.findOne(orgId);
    const org = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.settings !== undefined
          ? { settings: dto.settings as Prisma.InputJsonObject }
          : {}),
      },
    });
    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'org.updated',
      resourceType: 'organization',
      resourceId: orgId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return org;
  }

  async softDelete(
    orgId: string,
    userId: string,
    ctx: RequestContext,
  ): Promise<void> {
    await this.findOne(orgId);
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { deletedAt: new Date(), status: 'CLOSED' },
    });
    this.audit({
      tenantId: orgId,
      actorId: userId,
      action: 'org.deleted',
      resourceType: 'organization',
      resourceId: orgId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  // -------------------------------------------------------------------------
  // Membership management
  // -------------------------------------------------------------------------

  async listMembers(orgId: string): Promise<Membership[]> {
    return this.prisma.membership.findMany({
      where: { orgId, status: { not: MembershipStatus.REMOVED } },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Invite a member by email. Creates an INVITED membership carrying a hashed,
   * single-use invite token; the raw token is returned once for delivery by
   * the notifications module.
   */
  async inviteMember(
    orgId: string,
    dto: InviteMemberDto,
    actor: Membership,
    ctx: RequestContext,
  ): Promise<{ membership: Membership; inviteToken: string }> {
    if (!OrganizationsService.canAssignRole(actor.role, MembershipRole.MEMBER, dto.role)) {
      throw new ForbiddenException(
        `Your role (${actor.role}) may not invite a ${dto.role}`,
      );
    }

    const email = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const alreadyMember = await this.prisma.membership.findUnique({
        where: { orgId_userId: { orgId, userId: existingUser.id } },
        select: { id: true, status: true },
      });
      if (alreadyMember && alreadyMember.status !== MembershipStatus.REMOVED) {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    const rawToken = randomBytes(32).toString('base64url');
    const inviteToken = this.hashToken(rawToken);

    const membership = await this.prisma.membership.create({
      data: {
        orgId,
        // Link to the account now if it exists; external invitees are matched
        // on accept. A placeholder user link is required by the schema's
        // (orgId,userId) unique key, so unknown emails stay unlinked until
        // acceptance creates/attaches the user.
        userId: existingUser?.id ?? (await this.ensurePlaceholderUser(email)),
        role: dto.role,
        status: MembershipStatus.INVITED,
        invitedById: actor.userId,
        inviteEmail: email,
        inviteToken,
      },
    });

    this.audit({
      tenantId: orgId,
      actorId: actor.userId,
      action: 'org.member_invited',
      resourceType: 'membership',
      resourceId: membership.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { email, role: dto.role },
    });

    // Raw token returned once — never persisted in the clear.
    return { membership, inviteToken: rawToken };
  }

  async acceptInvite(
    rawToken: string,
    userId: string,
    ctx: RequestContext,
  ): Promise<AcceptedInvite> {
    const tokenHash = this.hashToken(rawToken);
    const membership = await this.prisma.membership.findFirst({
      where: { inviteToken: tokenHash, status: MembershipStatus.INVITED },
      include: { org: true },
    });
    if (!membership) {
      throw new NotFoundException('Invitation not found or already used');
    }

    const updated = await this.prisma.membership.update({
      where: { id: membership.id },
      data: {
        userId,
        status: MembershipStatus.ACTIVE,
        acceptedAt: new Date(),
        inviteToken: null,
      },
    });

    this.audit({
      tenantId: membership.orgId,
      actorId: userId,
      action: 'org.member_joined',
      resourceType: 'membership',
      resourceId: membership.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { membership: updated, organization: membership.org };
  }

  async changeMemberRole(
    orgId: string,
    membershipId: string,
    dto: UpdateMemberRoleDto,
    actor: Membership,
    ctx: RequestContext,
  ): Promise<Membership> {
    const target = await this.prisma.membership.findFirst({
      where: { id: membershipId, orgId },
    });
    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (!OrganizationsService.canAssignRole(actor.role, target.role, dto.role)) {
      throw new ForbiddenException(
        `Your role (${actor.role}) may not change ${target.role} to ${dto.role}`,
      );
    }

    // Never allow removing the last OWNER (would orphan the tenant).
    if (target.role === MembershipRole.OWNER && dto.role !== MembershipRole.OWNER) {
      await this.assertNotLastOwner(orgId, target.id);
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: dto.role },
    });

    this.audit({
      tenantId: orgId,
      actorId: actor.userId,
      action: 'org.member_role_changed',
      resourceType: 'membership',
      resourceId: membershipId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { from: target.role, to: dto.role },
    });

    return updated;
  }

  async removeMember(
    orgId: string,
    membershipId: string,
    actor: Membership,
    ctx: RequestContext,
  ): Promise<void> {
    const target = await this.prisma.membership.findFirst({
      where: { id: membershipId, orgId },
    });
    if (!target) {
      throw new NotFoundException('Member not found');
    }
    if (
      !OrganizationsService.canAssignRole(actor.role, target.role, target.role) &&
      actor.id !== target.id
    ) {
      throw new ForbiddenException('You may not remove this member');
    }
    if (target.role === MembershipRole.OWNER) {
      await this.assertNotLastOwner(orgId, target.id);
    }

    await this.prisma.membership.update({
      where: { id: membershipId },
      data: { status: MembershipStatus.REMOVED },
    });

    this.audit({
      tenantId: orgId,
      actorId: actor.userId,
      action: 'org.member_removed',
      resourceType: 'membership',
      resourceId: membershipId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async assertNotLastOwner(
    orgId: string,
    excludeMembershipId: string,
  ): Promise<void> {
    const otherOwners = await this.prisma.membership.count({
      where: {
        orgId,
        role: MembershipRole.OWNER,
        status: MembershipStatus.ACTIVE,
        id: { not: excludeMembershipId },
      },
    });
    if (otherOwners === 0) {
      throw new BadRequestException(
        'Cannot remove or demote the last owner of the organization',
      );
    }
  }

  /**
   * For invites to email addresses with no account yet, we create a PENDING
   * placeholder user so the (orgId,userId) unique key holds. Acceptance later
   * completes the profile. TODO(prod): replace with a dedicated Invitation
   * table decoupled from User to avoid placeholder rows.
   */
  private async ensurePlaceholderUser(email: string): Promise<string> {
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }
    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: 'Invited',
        lastName: 'User',
        status: 'PENDING_VERIFICATION',
      },
      select: { id: true },
    });
    return user.id;
  }

  private slugify(input: string): string {
    const slug = input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    if (!slug) {
      throw new BadRequestException('Cannot derive a valid slug');
    }
    return slug;
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private audit(input: AuditRecordInput): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, input);
  }
}
