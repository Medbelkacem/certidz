import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SignaturesModule } from '../signatures/signatures.module';
import { EnvelopesController } from './envelopes.controller';
import { EnvelopesProcessor } from './envelopes.processor';
import { ENVELOPES_QUEUE } from './envelopes.queue';
import { EnvelopesService } from './envelopes.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: ENVELOPES_QUEUE }),
    SignaturesModule,
  ],
  controllers: [EnvelopesController],
  providers: [EnvelopesService, EnvelopesProcessor],
  exports: [EnvelopesService],
})
export class EnvelopesModule {}
