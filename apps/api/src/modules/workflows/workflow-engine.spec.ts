import {
  WorkflowRunStatus,
  WorkflowRunStepStatus,
  WorkflowStepType,
  type WorkflowRun,
  type WorkflowRunStep,
  type WorkflowStep,
} from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { WorkflowEngineService } from './engine/workflow-engine.service';

type Json = Record<string, unknown>;

/** Minimal in-memory Prisma double for the workflow engine. */
function makePrisma(run: {
  id: string;
  status: WorkflowRunStatus;
  context?: Json;
  steps: WorkflowStep[];
  runSteps?: WorkflowRunStep[];
}) {
  const state = {
    status: run.status,
    context: run.context ?? {},
    finishedAt: null as Date | null,
  };
  const upserts: Array<{ stepId: string; status: WorkflowRunStepStatus }> = [];

  const loaded = () => ({
    id: run.id,
    workflowId: 'wf_1',
    orgId: 'org_1',
    status: state.status,
    context: state.context,
    startedById: null,
    startedAt: new Date(),
    finishedAt: state.finishedAt,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workflow: { steps: run.steps },
    steps: run.runSteps ?? [],
  });

  const prisma = {
    workflowRun: {
      findUnique: jest.fn(async () => loaded()),
      update: jest.fn(async ({ data }: { data: Partial<WorkflowRun> }) => {
        if (data.status) state.status = data.status;
        if (data.context) state.context = data.context as Json;
        if (data.finishedAt !== undefined)
          state.finishedAt = data.finishedAt as Date | null;
        return { ...loaded(), ...data };
      }),
      create: jest.fn(),
    },
    workflowRunStep: {
      upsert: jest.fn(
        async ({
          where,
          create,
        }: {
          where: { runId_stepId: { runId: string; stepId: string } };
          create: { status: WorkflowRunStepStatus };
        }) => {
          upserts.push({
            stepId: where.runId_stepId.stepId,
            status: create.status,
          });
          return create as unknown as WorkflowRunStep;
        },
      ),
    },
  };

  return { prisma: prisma as unknown as PrismaService, state, upserts };
}

function step(
  id: string,
  position: number,
  type: WorkflowStepType,
  condition: unknown = null,
): WorkflowStep {
  return {
    id,
    workflowId: 'wf_1',
    name: `step-${position}`,
    type,
    position,
    config: {},
    condition: condition as WorkflowStep['condition'],
    createdAt: new Date(),
  };
}

describe('WorkflowEngineService.advance', () => {
  it('completes a run of only auto steps', async () => {
    const { prisma, state, upserts } = makePrisma({
      id: 'run_1',
      status: WorkflowRunStatus.PENDING,
      steps: [
        step('s1', 1, WorkflowStepType.NOTIFICATION),
        step('s2', 2, WorkflowStepType.WEBHOOK),
      ],
    });
    const engine = new WorkflowEngineService(prisma);

    const result = await engine.advance('run_1');

    expect(result.status).toBe(WorkflowRunStatus.COMPLETED);
    expect(state.finishedAt).toBeInstanceOf(Date);
    expect(upserts.map((u) => u.status)).toEqual([
      WorkflowRunStepStatus.COMPLETED,
      WorkflowRunStepStatus.COMPLETED,
    ]);
  });

  it('branches: skips a step whose condition is false, then completes', async () => {
    const { prisma, upserts } = makePrisma({
      id: 'run_2',
      status: WorkflowRunStatus.PENDING,
      context: { amount: 100 },
      steps: [
        // amount (100) is NOT > 1000 → skipped
        step('s1', 1, WorkflowStepType.NOTIFICATION, {
          field: 'amount',
          op: 'gt',
          value: 1000,
        }),
        step('s2', 2, WorkflowStepType.NOTIFICATION),
      ],
    });
    const engine = new WorkflowEngineService(prisma);

    const result = await engine.advance('run_2');

    expect(result.status).toBe(WorkflowRunStatus.COMPLETED);
    expect(upserts).toEqual([
      { stepId: 's1', status: WorkflowRunStepStatus.SKIPPED },
      { stepId: 's2', status: WorkflowRunStepStatus.COMPLETED },
    ]);
  });

  it('takes the true branch when the condition is met', async () => {
    const { prisma, upserts } = makePrisma({
      id: 'run_2b',
      status: WorkflowRunStatus.PENDING,
      context: { amount: 5000 },
      steps: [
        step('s1', 1, WorkflowStepType.NOTIFICATION, {
          field: 'amount',
          op: 'gt',
          value: 1000,
        }),
      ],
    });
    const engine = new WorkflowEngineService(prisma);

    await engine.advance('run_2b');

    expect(upserts).toEqual([
      { stepId: 's1', status: WorkflowRunStepStatus.COMPLETED },
    ]);
  });

  it('parks the run in WAITING at a human (approval) step', async () => {
    const { prisma, state, upserts } = makePrisma({
      id: 'run_3',
      status: WorkflowRunStatus.PENDING,
      steps: [
        step('s1', 1, WorkflowStepType.NOTIFICATION),
        step('s2', 2, WorkflowStepType.APPROVAL),
        step('s3', 3, WorkflowStepType.NOTIFICATION),
      ],
    });
    const engine = new WorkflowEngineService(prisma);

    const result = await engine.advance('run_3');

    expect(result.status).toBe(WorkflowRunStatus.WAITING);
    expect(state.finishedAt).toBeNull();
    // s1 completed, s2 waiting, s3 never reached
    expect(upserts).toEqual([
      { stepId: 's1', status: WorkflowRunStepStatus.COMPLETED },
      { stepId: 's2', status: WorkflowRunStepStatus.WAITING },
    ]);
  });

  it('does not re-run already terminal steps', async () => {
    const done: WorkflowRunStep = {
      id: 'rs1',
      runId: 'run_4',
      stepId: 's1',
      status: WorkflowRunStepStatus.COMPLETED,
      output: {},
      error: null,
      startedAt: new Date(),
      finishedAt: new Date(),
      createdAt: new Date(),
    };
    const { prisma, upserts } = makePrisma({
      id: 'run_4',
      status: WorkflowRunStatus.RUNNING,
      steps: [
        step('s1', 1, WorkflowStepType.NOTIFICATION),
        step('s2', 2, WorkflowStepType.NOTIFICATION),
      ],
      runSteps: [done],
    });
    const engine = new WorkflowEngineService(prisma);

    await engine.advance('run_4');

    // Only s2 should be touched.
    expect(upserts).toEqual([
      { stepId: 's2', status: WorkflowRunStepStatus.COMPLETED },
    ]);
  });

  it('returns immediately for a terminal run', async () => {
    const { prisma, upserts } = makePrisma({
      id: 'run_5',
      status: WorkflowRunStatus.COMPLETED,
      steps: [step('s1', 1, WorkflowStepType.NOTIFICATION)],
    });
    const engine = new WorkflowEngineService(prisma);

    const result = await engine.advance('run_5');

    expect(result.status).toBe(WorkflowRunStatus.COMPLETED);
    expect(upserts).toEqual([]);
  });
});
