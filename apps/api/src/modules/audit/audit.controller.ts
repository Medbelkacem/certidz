import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { paginate } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../organizations/guards/permissions.guard';
import { TenantGuard } from '../organizations/guards/tenant.guard';
import { RequirePermission } from '../organizations/decorators/require-permission.decorator';
import { Permission } from '../organizations/permissions';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  @RequirePermission(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Query the tenant audit trail' })
  @ApiParam({ name: 'orgId' })
  @ApiOkResponse({ description: 'Paginated audit events' })
  async queryEvents(
    @Param('orgId') orgId: string,
    @Query() query: QueryAuditDto,
  ) {
    const { items, total } = await this.auditService.query({
      tenantId: orgId,
      action: query.action,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      actorId: query.actorId,
      from: query.from,
      to: query.to,
      skip: query.skip,
      take: query.take,
    });
    return paginate(items, total, query);
  }

  @Get('verify')
  @RequirePermission(Permission.AUDIT_READ)
  @ApiOperation({
    summary: 'Verify hash-chain integrity of the tenant audit trail',
  })
  @ApiParam({ name: 'orgId' })
  verifyChain(@Param('orgId') orgId: string) {
    return this.auditService.verifyChain(orgId);
  }
}
