import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  type WorkflowRun,
  type WorkflowRunStep,
  type WorkflowStep,
  WorkflowRunStatus,
  WorkflowRunStepStatus,
  WorkflowStepType,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  type Condition,
  type ConditionContext,
  evaluateCondition,
} from './condition';

/**
 * Step types the engine can execute inline (no external actor). Everything
 * else parks the run in WAITING until an external event resumes it.
 */
const AUTO_STEP_TYPES: ReadonlySet<WorkflowStepType> = new Set([
  WorkflowStepType.NOTIFICATION,
  WorkflowStepType.WEBHOOK,
  WorkflowStepType.CONDITION,
]);

const TERMINAL_RUN_STEP: ReadonlySet<WorkflowRunStepStatus> = new Set([
  WorkflowRunStepStatus.COMPLETED,
  WorkflowRunStepStatus.SKIPPED,
  WorkflowRunStepStatus.FAILED,
]);

type LoadedRun = WorkflowRun & {
  workflow: { steps: WorkflowStep[] };
  steps: WorkflowRunStep[];
};

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create a fresh run for a workflow with an initial context. */
  async startRun(params: {
    workflowId: string;
    orgId: string;
    startedById?: string | null;
    context?: ConditionContext;
  }): Promise<WorkflowRun> {
    return this.prisma.workflowRun.create({
      data: {
        workflowId: params.workflowId,
        orgId: params.orgId,
        startedById: params.startedById ?? null,
        status: WorkflowRunStatus.PENDING,
        context: (params.context ?? {}) as Prisma.InputJsonObject,
        startedAt: new Date(),
      },
    });
  }

  /**
   * Drive a run forward: evaluate and execute steps in position order until
   * the run either completes or reaches a step that must wait for an external
   * actor (approval, signature, delay…). Auto steps run inline; steps whose
   * `condition` evaluates to false are SKIPPED (this is the branch point).
   *
   * Idempotent and resumable: already-terminal run steps are never re-run.
   */
  async advance(runId: string): Promise<WorkflowRun> {
    const run = await this.load(runId);

    if (this.isTerminal(run.status)) {
      return run;
    }

    // A step still WAITING blocks progress until it is resumed externally.
    const waiting = run.steps.find(
      (s) => s.status === WorkflowRunStepStatus.WAITING,
    );
    if (waiting) {
      return this.setRunStatus(runId, WorkflowRunStatus.WAITING);
    }

    if (run.status === WorkflowRunStatus.PENDING) {
      await this.setRunStatus(runId, WorkflowRunStatus.RUNNING);
    }

    const orderedSteps = [...run.workflow.steps].sort(
      (a, b) => a.position - b.position,
    );
    let context: ConditionContext = this.asContext(run.context);
    const byStepId = new Map(run.steps.map((s) => [s.stepId, s]));

    for (const step of orderedSteps) {
      const existing = byStepId.get(step.id);
      if (existing && TERMINAL_RUN_STEP.has(existing.status)) {
        continue; // already processed
      }

      // Branch: a false condition skips the step entirely.
      if (!this.conditionMet(step.condition, context)) {
        await this.upsertRunStep(runId, step.id, {
          status: WorkflowRunStepStatus.SKIPPED,
          finishedAt: new Date(),
        });
        continue;
      }

      if (!AUTO_STEP_TYPES.has(step.type)) {
        // Human / timed step: park the run and wait for an external resume.
        await this.upsertRunStep(runId, step.id, {
          status: WorkflowRunStepStatus.WAITING,
          startedAt: new Date(),
        });
        return this.setRunStatus(runId, WorkflowRunStatus.WAITING);
      }

      // Auto step: execute inline and merge its output into the context.
      const output = this.executeAuto(step);
      context = { ...context, ...output };
      await this.upsertRunStep(runId, step.id, {
        status: WorkflowRunStepStatus.COMPLETED,
        output: output as Prisma.InputJsonObject,
        startedAt: new Date(),
        finishedAt: new Date(),
      });
      await this.prisma.workflowRun.update({
        where: { id: runId },
        data: { context: context as Prisma.InputJsonObject },
      });
    }

    // No step left to run → the run is complete.
    return this.prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: WorkflowRunStatus.COMPLETED,
        finishedAt: new Date(),
        context: context as Prisma.InputJsonObject,
      },
    });
  }

  /**
   * Resume a WAITING step (e.g. an approval was granted). Marks the step
   * COMPLETED, merges its output into the run context, then advances.
   */
  async resumeStep(
    runId: string,
    stepId: string,
    output: Record<string, unknown> = {},
  ): Promise<WorkflowRun> {
    const run = await this.load(runId);
    const context = { ...this.asContext(run.context), ...output };
    await this.upsertRunStep(runId, stepId, {
      status: WorkflowRunStepStatus.COMPLETED,
      output: output as Prisma.InputJsonObject,
      finishedAt: new Date(),
    });
    await this.prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: WorkflowRunStatus.RUNNING,
        context: context as Prisma.InputJsonObject,
      },
    });
    return this.advance(runId);
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async load(runId: string): Promise<LoadedRun> {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id: runId },
      include: {
        workflow: { include: { steps: { orderBy: { position: 'asc' } } } },
        steps: true,
      },
    });
    if (!run) {
      throw new NotFoundException(`Workflow run ${runId} not found`);
    }
    return run as LoadedRun;
  }

  private isTerminal(status: WorkflowRunStatus): boolean {
    return (
      status === WorkflowRunStatus.COMPLETED ||
      status === WorkflowRunStatus.FAILED ||
      status === WorkflowRunStatus.CANCELLED
    );
  }

  private conditionMet(
    condition: Prisma.JsonValue | null,
    context: ConditionContext,
  ): boolean {
    if (condition === null || condition === undefined) {
      return true;
    }
    return evaluateCondition(condition as unknown as Condition, context);
  }

  private asContext(value: Prisma.JsonValue): ConditionContext {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as ConditionContext)
      : {};
  }

  /**
   * Inline execution for auto step types. Real side effects (dispatching a
   * notification, firing a webhook) are performed by the respective modules
   * subscribing to the emitted output; here we return a structured record.
   */
  private executeAuto(step: WorkflowStep): Record<string, unknown> {
    return {
      [`step_${step.position}_result`]: {
        stepId: step.id,
        type: step.type,
        executedAt: new Date().toISOString(),
      },
    };
  }

  private async upsertRunStep(
    runId: string,
    stepId: string,
    data: {
      status?: WorkflowRunStepStatus;
      output?: Prisma.InputJsonValue;
      error?: string | null;
      startedAt?: Date | null;
      finishedAt?: Date | null;
    },
  ): Promise<WorkflowRunStep> {
    return this.prisma.workflowRunStep.upsert({
      where: { runId_stepId: { runId, stepId } },
      create: {
        runId,
        stepId,
        status: data.status ?? WorkflowRunStepStatus.PENDING,
        output: (data.output ?? undefined) as Prisma.InputJsonValue,
        error: data.error ?? null,
        startedAt: data.startedAt ?? null,
        finishedAt: data.finishedAt ?? null,
      },
      update: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.output !== undefined
          ? { output: data.output as Prisma.InputJsonValue }
          : {}),
        ...(data.error !== undefined ? { error: data.error } : {}),
        ...(data.startedAt ? { startedAt: data.startedAt } : {}),
        ...(data.finishedAt ? { finishedAt: data.finishedAt } : {}),
      },
    });
  }

  private async setRunStatus(
    runId: string,
    status: WorkflowRunStatus,
  ): Promise<WorkflowRun> {
    return this.prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status,
        ...(status === WorkflowRunStatus.COMPLETED ||
        status === WorkflowRunStatus.FAILED
          ? { finishedAt: new Date() }
          : {}),
      },
    });
  }
}
