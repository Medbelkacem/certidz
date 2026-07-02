import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../organizations/decorators/require-permission.decorator';
import { PermissionsGuard } from '../organizations/guards/permissions.guard';
import { TenantGuard } from '../organizations/guards/tenant.guard';
import { Permission } from '../organizations/permissions';
import { SignaturesService } from './signatures.service';

@ApiTags('signatures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/signatures')
export class SignaturesController {
  constructor(private readonly signatures: SignaturesService) {}

  @Get(':id/verify')
  @RequirePermission(Permission.ENVELOPES_READ)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({
    summary:
      'Verify a signature: document integrity, CMS signature, cert chain, revocation',
  })
  @ApiOkResponse({ description: 'Verification report' })
  verify(@Param('orgId') _orgId: string, @Param('id') id: string) {
    return this.signatures.verify(id);
  }

  @Get('by-signer/:signerId')
  @RequirePermission(Permission.ENVELOPES_READ)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'signerId' })
  @ApiOperation({ summary: 'List signatures applied by a signer' })
  bySigner(
    @Param('orgId') _orgId: string,
    @Param('signerId') signerId: string,
  ) {
    return this.signatures.getForSigner(signerId);
  }
}
