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
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiParam({ name: 'orgId' })
@Controller('orgs/:orgId/webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  @ApiOperation({ summary: 'Register a webhook (secret returned once)' })
  @ApiCreatedResponse({ description: 'Webhook + its signing secret' })
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateWebhookDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.webhooks.create(orgId, dto, { actorId: user.id, ip, userAgent });
  }

  @Get()
  @ApiOperation({ summary: 'List webhooks' })
  list(@Param('orgId') orgId: string) {
    return this.webhooks.list(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook' })
  get(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.webhooks.get(orgId, id);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'List recent delivery attempts for a webhook' })
  @ApiOkResponse({ description: 'Up to 100 recent deliveries' })
  deliveries(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.webhooks.listDeliveries(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook (url / events / active)' })
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.webhooks.update(orgId, id, dto, {
      actorId: user.id,
      ip,
      userAgent,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook' })
  remove(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.webhooks.remove(orgId, id, { actorId: user.id, ip, userAgent });
  }
}
