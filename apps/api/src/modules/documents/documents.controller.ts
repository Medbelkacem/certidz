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
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../organizations/decorators/require-permission.decorator';
import { PermissionsGuard } from '../organizations/guards/permissions.guard';
import { TenantGuard } from '../organizations/guards/tenant.guard';
import { Permission } from '../organizations/permissions';
import { DocumentsService } from './documents.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { UpdateTagsDto } from './dto/update-tags.dto';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post('upload-url')
  @RequirePermission(Permission.DOCUMENTS_WRITE)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Request a presigned upload URL' })
  @ApiCreatedResponse({ description: 'Object key + presigned PUT URL' })
  requestUploadUrl(
    @Param('orgId') orgId: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.documents.requestUploadUrl(orgId, dto);
  }

  @Post('confirm')
  @RequirePermission(Permission.DOCUMENTS_WRITE)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'Confirm an upload and persist the document' })
  @ApiCreatedResponse({ description: 'Persisted document' })
  confirm(
    @Param('orgId') orgId: string,
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.documents.confirmUpload(orgId, user.id, dto, { ip, userAgent });
  }

  @Get()
  @RequirePermission(Permission.DOCUMENTS_READ)
  @ApiParam({ name: 'orgId' })
  @ApiOperation({ summary: 'List documents (folder/tag/status filters)' })
  @ApiOkResponse({ description: 'Paginated documents' })
  list(@Param('orgId') orgId: string, @Query() query: QueryDocumentsDto) {
    return this.documents.list(orgId, query);
  }

  @Get(':id')
  @RequirePermission(Permission.DOCUMENTS_READ)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Get a document with its versions' })
  getOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.documents.getOne(orgId, id);
  }

  @Get(':id/download-url')
  @RequirePermission(Permission.DOCUMENTS_READ)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Presigned download URL for the current version' })
  downloadUrl(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.documents.getDownloadUrl(orgId, id);
  }

  @Post(':id/versions')
  @RequirePermission(Permission.DOCUMENTS_WRITE)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Add a new document version' })
  createVersion(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.documents.createVersion(orgId, user.id, id, dto, {
      ip,
      userAgent,
    });
  }

  @Patch(':id/tags')
  @RequirePermission(Permission.DOCUMENTS_WRITE)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Add/remove document tags' })
  updateTags(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTagsDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.documents.updateTags(orgId, user.id, id, dto, { ip, userAgent });
  }

  @Delete(':id')
  @RequirePermission(Permission.DOCUMENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'orgId' })
  @ApiParam({ name: 'id' })
  @ApiOperation({ summary: 'Soft-delete a document' })
  async remove(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    await this.documents.softDelete(orgId, user.id, id, { ip, userAgent });
  }
}
