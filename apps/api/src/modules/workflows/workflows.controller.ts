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
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { StartRunDto } from './dto/start-run.dto';
import { WorkflowsService } from './workflows.service';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiParam({ name: 'orgId' })
@Controller('orgs/:orgId/workflows')
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a workflow template with ordered steps' })
  @ApiCreatedResponse({ description: 'Workflow created (DRAFT)' })
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateWorkflowDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.workflows.create(orgId, dto, { actorId: user.id, ip, userAgent });
  }

  @Get()
  @ApiOperation({ summary: 'List workflow templates' })
  list(@Param('orgId') orgId: string) {
    return this.workflows.list(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow template' })
  get(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.workflows.get(orgId, id);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a workflow (DRAFT → PUBLISHED)' })
  publish(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.workflows.publish(orgId, id, { actorId: user.id, ip, userAgent });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a workflow' })
  remove(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.workflows.remove(orgId, id, { actorId: user.id, ip, userAgent });
  }

  @Post(':id/runs')
  @ApiOperation({ summary: 'Start a workflow run (advances on the queue)' })
  @ApiOkResponse({ description: 'Run created and enqueued' })
  startRun(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: StartRunDto,
    @CurrentUser() user: AuthUser,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.workflows.startRun(orgId, id, dto.context ?? {}, {
      actorId: user.id,
      ip,
      userAgent,
    });
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: 'Get a workflow run with its step states' })
  getRun(@Param('orgId') orgId: string, @Param('runId') runId: string) {
    return this.workflows.getRun(orgId, runId);
  }

  @Post('runs/:runId/steps/:stepId/resume')
  @ApiOperation({ summary: 'Resume a WAITING step (e.g. approval granted)' })
  resumeStep(
    @Param('orgId') orgId: string,
    @Param('runId') runId: string,
    @Param('stepId') stepId: string,
    @Body() output: Record<string, unknown>,
  ) {
    return this.workflows.resumeStep(orgId, runId, stepId, output ?? {});
  }
}
