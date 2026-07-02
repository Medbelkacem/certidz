import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UsageMetric } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { ChangePlanDto } from './dto/change-plan.dto';
import { RecordUsageDto } from './dto/record-usage.dto';
import { PLANS } from './plans';
import { UsageService } from './usage.service';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiParam({ name: 'orgId' })
@Controller('orgs/:orgId/billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly usage: UsageService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available plans and their limits' })
  plans() {
    return Object.values(PLANS);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get the current subscription and plan' })
  @ApiOkResponse({ description: 'Current plan + subscription (if any)' })
  current(@Param('orgId') orgId: string) {
    return this.billing.getCurrent(orgId);
  }

  @Put('subscription')
  @ApiOperation({
    summary: 'Change plan (Free applies immediately; paid opens checkout)',
  })
  changePlan(
    @Param('orgId') orgId: string,
    @Body() dto: ChangePlanDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.billing.changePlan(orgId, dto, {
      actorId: user.id,
      ip,
      userAgent,
    });
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  invoices(@Param('orgId') orgId: string) {
    return this.billing.listInvoices(orgId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get current-period usage vs plan limit' })
  usageStatus(
    @Param('orgId') orgId: string,
    @Query('metric') metric: UsageMetric = UsageMetric.ENVELOPES_SENT,
  ) {
    return this.usage.getStatus(orgId, metric);
  }

  @Post('usage')
  @ApiOperation({ summary: 'Record metered usage (enforces plan limit)' })
  recordUsage(
    @Param('orgId') orgId: string,
    @Body() dto: RecordUsageDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.billing.recordUsage(orgId, dto.metric, dto.quantity, {
      actorId: user.id,
      ip,
      userAgent,
    });
  }
}
