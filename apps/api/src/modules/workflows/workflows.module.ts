import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { WorkflowProcessor } from './workflow.processor';
import { WORKFLOWS_QUEUE } from './workflow.queue';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [BullModule.registerQueue({ name: WORKFLOWS_QUEUE })],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowEngineService, WorkflowProcessor],
  exports: [WorkflowsService, WorkflowEngineService],
})
export class WorkflowsModule {}
