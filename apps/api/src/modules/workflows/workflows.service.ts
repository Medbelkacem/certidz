import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Prisma,
  type Workflow,
  type WorkflowRun,
  WorkflowStatus,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RECORD_EVENT, type AuditRecordInput } from '../audit/audit.types';
import type { RequestContext } from '../auth/auth.types';
import { assertCondition } from './engine/condition';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import type { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WORKFLOWS_QUEUE, WORKFLOW_ADVANCE_JOB } from './workflow.queue';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: WorkflowEngineService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(WORKFLOWS_QUEUE) private readonly queue: Queue,
  ) {}

  // -------------------------------------------------------------------------
  // Template CRUD
  // -------------------------------------------------------------------------

  async create(
    orgId: string,
    dto: CreateWorkflowDto,
    ctx: RequestContext & { actorId: string },
  ): Promise<Workflow> {
    this.validateSteps(dto);

    const workflow = await this.prisma.workflow.create({
      data: {
        orgId,
        name: dto.name,
        description: dto.description ?? null,
        createdById: ctx.actorId,
        steps: {
          create: dto.steps.map((s) => ({
            name: s.name,
            type: s.type,
            position: s.position,
            config: (s.config ?? {}) as Prisma.InputJsonObject,
            condition:
              s.condition == null
                ? Prisma.JsonNull
                : (s.condition as Prisma.InputJsonValue),
          })),
        },
      },
      include: { steps: { orderBy: { position: 'asc' } } },
    });

    this.audit(orgId, ctx, {
      action: 'workflow.created',
      resourceId: workflow.id,
      metadata: { name: workflow.name, steps: dto.steps.length },
    });

    return workflow;
  }

  list(orgId: string): Promise<Workflow[]> {
    return this.prisma.workflow.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      include: { steps: { orderBy: { position: 'asc' } } },
    });
  }

  async get(orgId: string, id: string): Promise<Workflow> {
    const wf = await this.prisma.workflow.findFirst({
      where: { id, orgId },
      include: { steps: { orderBy: { position: 'asc' } } },
    });
    if (!wf) {
      throw new NotFoundException('Workflow not found');
    }
    return wf;
  }

  async publish(
    orgId: string,
    id: string,
    ctx: RequestContext & { actorId: string },
  ): Promise<Workflow> {
    await this.get(orgId, id);
    const wf = await this.prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.PUBLISHED },
    });
    this.audit(orgId, ctx, {
      action: 'workflow.published',
      resourceId: id,
    });
    return wf;
  }

  async remove(
    orgId: string,
    id: string,
    ctx: RequestContext & { actorId: string },
  ): Promise<void> {
    await this.get(orgId, id);
    await this.prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.ARCHIVED },
    });
    this.audit(orgId, ctx, { action: 'workflow.archived', resourceId: id });
  }

  // -------------------------------------------------------------------------
  // Runs
  // -------------------------------------------------------------------------

  async startRun(
    orgId: string,
    workflowId: string,
    context: Record<string, unknown>,
    ctx: RequestContext & { actorId: string },
  ): Promise<WorkflowRun> {
    await this.get(orgId, workflowId);
    const run = await this.engine.startRun({
      workflowId,
      orgId,
      startedById: ctx.actorId,
      context,
    });

    // Advancement happens asynchronously on the workflows queue.
    await this.queue.add(WORKFLOW_ADVANCE_JOB, { runId: run.id });

    this.audit(orgId, ctx, {
      action: 'workflow.run_started',
      resourceId: run.id,
      metadata: { workflowId },
    });

    return run;
  }

  async getRun(orgId: string, runId: string): Promise<WorkflowRun> {
    const run = await this.prisma.workflowRun.findFirst({
      where: { id: runId, orgId },
      include: { steps: true },
    });
    if (!run) {
      throw new NotFoundException('Run not found');
    }
    return run;
  }

  /** Resume a WAITING step and queue further advancement. */
  async resumeStep(
    orgId: string,
    runId: string,
    stepId: string,
    output: Record<string, unknown>,
  ): Promise<WorkflowRun> {
    await this.getRun(orgId, runId);
    const run = await this.engine.resumeStep(runId, stepId, output);
    await this.queue.add(WORKFLOW_ADVANCE_JOB, { runId });
    return run;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private validateSteps(dto: CreateWorkflowDto): void {
    const positions = new Set<number>();
    for (const step of dto.steps) {
      if (positions.has(step.position)) {
        throw new BadRequestException(
          `Duplicate step position ${step.position}`,
        );
      }
      positions.add(step.position);
      if (step.condition != null) {
        try {
          assertCondition(step.condition);
        } catch (err) {
          throw new BadRequestException(
            `Invalid condition on step "${step.name}": ${String(
              (err as Error).message,
            )}`,
          );
        }
      }
    }
  }

  private audit(
    orgId: string,
    ctx: RequestContext & { actorId: string },
    partial: Pick<AuditRecordInput, 'action' | 'resourceId' | 'metadata'>,
  ): void {
    this.eventEmitter.emit(AUDIT_RECORD_EVENT, {
      tenantId: orgId,
      actorId: ctx.actorId,
      resourceType: 'workflow',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      ...partial,
    } satisfies AuditRecordInput);
  }
}
