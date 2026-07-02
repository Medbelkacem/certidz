import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  Query,
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
import { RevocationReason } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../organizations/decorators/require-permission.decorator';
import { PermissionsGuard } from '../organizations/guards/permissions.guard';
import { TenantGuard } from '../organizations/guards/tenant.guard';
import { Permission } from '../organizations/permissions';
import { CaService } from './ca.service';
import { CertificatesService } from './certificates.service';
import { GenerateCertificateDto } from './dto/generate-certificate.dto';
import { IssueFromCsrDto } from './dto/issue-from-csr.dto';
import { RevokeCertificateDto } from './dto/revoke-certificate.dto';

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/certificates')
export class CertificatesController {
  constructor(
    private readonly certificates: CertificatesService,
    private readonly ca: CaService,
  ) {}

  @Post('from-csr')
  @RequirePermission(Permission.CERTIFICATES_ISSUE)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Issue an end-entity certificate from a CSR' })
  @ApiCreatedResponse({ description: 'Issued certificate' })
  issueFromCsr(
    @Param('orgId') orgId: string,
    @Body() dto: IssueFromCsrDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.certificates.issueFromCsr(orgId, user.id, dto, { ip, userAgent });
  }

  @Post('generate')
  @RequirePermission(Permission.CERTIFICATES_ISSUE)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({
    summary: 'Generate a keypair server-side and issue a certificate (dev)',
  })
  @ApiCreatedResponse({
    description: 'Issued certificate + private key (returned once)',
  })
  generate(
    @Param('orgId') orgId: string,
    @Body() dto: GenerateCertificateDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.certificates.generateAndIssue(orgId, user.id, dto, {
      ip,
      userAgent,
    });
  }

  @Get()
  @RequirePermission(Permission.CERTIFICATES_READ)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'List certificates' })
  @ApiOkResponse({ description: 'Paginated certificates' })
  list(@Param('orgId') orgId: string, @Query() pagination: PaginationDto) {
    return this.certificates.list(orgId, pagination);
  }

  @Get('ca-chain')
  @RequirePermission(Permission.CERTIFICATES_READ)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Fetch the CA chain (issuing + root PEM)' })
  async caChain(@Param('orgId') _orgId: string) {
    const [issuing, root] = await Promise.all([
      this.ca.getIssuingCertPem(),
      this.ca.getRootCertPem(),
    ]);
    return { issuingCaPem: issuing, rootCaPem: root };
  }

  @Get('crl')
  @RequirePermission(Permission.CERTIFICATES_READ)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Certificate revocation list (DB projection)' })
  crl(@Param('orgId') orgId: string) {
    return this.certificates.getCrl(orgId);
  }

  @Get('ocsp/:serial')
  @RequirePermission(Permission.CERTIFICATES_READ)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'serial' })
  @ApiOperation({ summary: 'OCSP-style status for a certificate serial' })
  ocsp(@Param('orgId') _orgId: string, @Param('serial') serial: string) {
    return this.certificates.getStatus(serial);
  }

  @Get(':id')
  @RequirePermission(Permission.CERTIFICATES_READ)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Get a certificate' })
  getOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.certificates.getOne(orgId, id);
  }

  @Post(':id/revoke')
  @RequirePermission(Permission.CERTIFICATES_REVOKE)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Revoke a certificate' })
  revoke(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: RevokeCertificateDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.certificates.revoke(
      orgId,
      id,
      dto.reason ?? RevocationReason.UNSPECIFIED,
      user.id,
      { ip, userAgent },
    );
  }
}
