/** Shared queue/job names for the workflow engine. */
export const WORKFLOWS_QUEUE = 'workflows';
export const WORKFLOW_ADVANCE_JOB = 'advance';

export interface WorkflowAdvanceJob {
  runId: string;
}
