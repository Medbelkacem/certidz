import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Membership } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { CurrentMembership } from './decorators/current-membership.decorator';
import { RequirePermission } from './decorators/require-permission.decorator';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PermissionsGuard } from './guards/permissions.guard';
import { TenantGuard } from './guards/tenant.guard';
import { OrganizationsService } from './organizations.service';
import { Permission } from './permissions';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('orgs')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  // --- Org lifecycle (no tenant guard: creating / accepting predates membership)

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create an organization (caller becomes OWNER)' })
  @ApiCreatedResponse({ description: 'Organization created' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrganizationDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.organizations.create(dto, user.id, { ip, userAgent });
  }

  @Post('invites/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an organization invitation' })
  acceptInvite(
    @CurrentUser() user: AuthUser,
    @Body() dto: AcceptInviteDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.organizations.acceptInvite(dto.token, user.id, { ip, userAgent });
  }

  // --- Tenant-scoped routes ------------------------------------------------

  @Get(':orgId')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Get an organization' })
  @ApiOkResponse({ description: 'Organization' })
  findOne(@Param('orgId') orgId: string) {
    return this.organizations.findOne(orgId);
  }

  @Patch(':orgId')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermission(Permission.SETTINGS_MANAGE)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Update organization settings' })
  update(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.organizations.update(orgId, dto, user.id, { ip, userAgent });
  }

  @Delete(':orgId')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermission(Permission.ORG_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Soft-delete (close) an organization' })
  async remove(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.organizations.softDelete(orgId, user.id, { ip, userAgent });
  }

  // --- Members -------------------------------------------------------------

  @Get(':orgId/members')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermission(Permission.MEMBERS_READ)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'List organization members' })
  listMembers(@Param('orgId') orgId: string) {
    return this.organizations.listMembers(orgId);
  }

  @Post(':orgId/members/invite')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermission(Permission.MEMBERS_MANAGE)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Invite a member by email' })
  @ApiCreatedResponse({ description: 'Invitation created (raw token returned once)' })
  invite(
    @Param('orgId') orgId: string,
    @Body() dto: InviteMemberDto,
    @CurrentMembership() membership: Membership,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.organizations.inviteMember(orgId, dto, membership, {
      ip,
      userAgent,
    });
  }

  @Patch(':orgId/members/:membershipId/role')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermission(Permission.MEMBERS_MANAGE)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'membershipId' })
  @ApiOperation({ summary: "Change a member's role" })
  changeRole(
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentMembership() membership: Membership,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.organizations.changeMemberRole(orgId, membershipId, dto, membership, {
      ip,
      userAgent,
    });
  }

  @Delete(':orgId/members/:membershipId')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermission(Permission.MEMBERS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'membershipId' })
  @ApiOperation({ summary: 'Remove a member' })
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
    @CurrentMembership() membership: Membership,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.organizations.removeMember(orgId, membershipId, membership, {
      ip,
      userAgent,
    });
  }
}
