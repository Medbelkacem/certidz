import {
  Body,
  Controller,
  Get,
  Headers,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { AddDocumentDto } from './dto/add-document.dto';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { IdentityService } from './identity.service';

@ApiTags('identity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiParam({ name: 'orgId' })
@Controller('orgs/:orgId/identity/verifications')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post()
  @ApiOperation({ summary: 'Create an identity-verification session' })
  @ApiCreatedResponse({ description: 'Session created (PENDING_DOCUMENTS)' })
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateVerificationDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.identityService.createSession(orgId, dto, {
      actorId: user.id,
      ip,
      userAgent,
    });
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Attach identity-document metadata to a session' })
  @ApiCreatedResponse({ description: 'Document metadata stored' })
  addDocument(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: AddDocumentDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.identityService.addDocument(orgId, id, dto, {
      actorId: user.id,
      ip,
      userAgent,
    });
  }

  @Post(':id/run')
  @ApiOperation({
    summary: 'Run the provider checks and produce a verification decision',
  })
  @ApiOkResponse({
    description: 'Decision with confidenceScore + riskFlags',
  })
  run(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.identityService.runVerification(orgId, id, {
      actorId: user.id,
      ip,
      userAgent,
    });
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get the verification result (score + risk flags)' })
  @ApiOkResponse({ description: 'Verification result' })
  result(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.identityService.getResult(orgId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a verification session with its documents' })
  get(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.identityService.get(orgId, id);
  }
}
