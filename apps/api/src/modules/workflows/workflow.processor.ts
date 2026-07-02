import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import {
  WORKFLOWS_QUEUE,
  WORKFLOW_ADVANCE_JOB,
  type WorkflowAdvanceJob,
} from './workflow.queue';

/**
 * Advances workflow runs off the request path. Each `advance` job drives one
 * run until it completes or parks in WAITING; if it parks, a later external
 * event (approval granted, signature completed) enqueues the next advance.
 */
@Processor(WORKFLOWS_QUEUE)
export class WorkflowProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowProcessor.name);

  constructor(private readonly engine: WorkflowEngineService) {
    super();
  }

  async process(job: Job<WorkflowAdvanceJob>): Promise<void> {
    if (job.name !== WORKFLOW_ADVANCE_JOB) {
      this.logger.warn(`Unknown job ${job.name} on ${WORKFLOWS_QUEUE}`);
      return;
    }
    const { runId } = job.data;
    const run = await this.engine.advance(runId);
    this.logger.debug(`Advanced run ${runId} → ${run.status}`);
  }
}
