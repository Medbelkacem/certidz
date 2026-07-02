import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
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
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../organizations/decorators/require-permission.decorator';
import { PermissionsGuard } from '../organizations/guards/permissions.guard';
import { TenantGuard } from '../organizations/guards/tenant.guard';
import { Permission } from '../organizations/permissions';
import { AddFieldDto } from './dto/add-field.dto';
import { AddSignerDto } from './dto/add-signer.dto';
import { CreateEnvelopeDto } from './dto/create-envelope.dto';
import { DeclineDto, VoidEnvelopeDto } from './dto/signer-action.dto';
import { EnvelopesService } from './envelopes.service';

/**
 * Tenant-scoped envelope API. Signer actions (view/consent/sign/decline) are
 * exposed here for authenticated org members and API integrations; a
 * token-authenticated public signing surface for external signers is a
 * TODO(prod) extension (one-time `accessTokenHash` links already modeled).
 */
@ApiTags('envelopes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/envelopes')
export class EnvelopesController {
  constructor(private readonly envelopes: EnvelopesService) {}

  @Post()
  @RequirePermission(Permission.ENVELOPES_SEND)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Create a signature request (draft) from a document' })
  @ApiCreatedResponse({ description: 'Draft envelope' })
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateEnvelopeDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.envelopes.create(orgId, user.id, dto, { ip, userAgent });
  }

  @Post(':id/signers')
  @RequirePermission(Permission.ENVELOPES_SEND)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Add a signer to a draft envelope' })
  addSigner(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: AddSignerDto,
  ) {
    return this.envelopes.addSigner(orgId, id, dto);
  }

  @Post(':id/fields')
  @RequirePermission(Permission.ENVELOPES_SEND)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Add a signature field to a draft envelope' })
  addField(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: AddFieldDto,
  ) {
    return this.envelopes.addField(orgId, id, dto);
  }

  @Post(':id/send')
  @RequirePermission(Permission.ENVELOPES_SEND)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Send the envelope (DRAFT → SENT) and notify signers' })
  send(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.envelopes.send(orgId, id, user.id, { ip, userAgent });
  }

  @Get(':id')
  @RequirePermission(Permission.ENVELOPES_READ)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Get envelope status + progress' })
  @ApiOkResponse({ description: 'Envelope with signers, fields and progress' })
  status(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.envelopes.getStatus(orgId, id);
  }

  // --- Signer actions ------------------------------------------------------

  @Post(':id/signers/:signerId/view')
  @RequirePermission(Permission.ENVELOPES_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'signerId' })
  @ApiOperation({ summary: 'Record that a signer viewed the envelope' })
  async view(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Param('signerId') signerId: string,
  ): Promise<void> {
    await this.envelopes.markViewed(orgId, id, signerId);
  }

  @Post(':id/signers/:signerId/consent')
  @RequirePermission(Permission.ENVELOPES_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'signerId' })
  @ApiOperation({ summary: 'Record a signer consent (e-signature disclosure)' })
  async consent(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Param('signerId') signerId: string,
  ): Promise<void> {
    await this.envelopes.consent(orgId, id, signerId);
  }

  @Post(':id/signers/:signerId/sign')
  @RequirePermission(Permission.ENVELOPES_READ)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'signerId' })
  @ApiOperation({
    summary: 'Apply a signer signature (enforces signing order; hashes + CMS)',
  })
  sign(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Param('signerId') signerId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.envelopes.sign(orgId, id, signerId, { ip, userAgent });
  }

  @Post(':id/signers/:signerId/decline')
  @RequirePermission(Permission.ENVELOPES_READ)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'signerId' })
  @ApiOperation({ summary: 'Decline signing (terminates the envelope)' })
  async decline(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Param('signerId') signerId: string,
    @Body() dto: DeclineDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.envelopes.decline(orgId, id, signerId, dto.reason, {
      ip,
      userAgent,
    });
  }

  @Post(':id/void')
  @RequirePermission(Permission.ENVELOPES_VOID)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Void an envelope' })
  voidEnvelope(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: VoidEnvelopeDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.envelopes.void(orgId, id, user.id, dto.reason, { ip, userAgent });
  }
}
