import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiGatewayService } from './ai-gateway.service';
import { AI_PROVIDER } from './ai.types';
import { ClaudeProvider } from './providers/claude.provider';

@Module({
  controllers: [AiController],
  providers: [
    AiGatewayService,
    ClaudeProvider,
    // Bind the provider-agnostic token to Claude. Swap here (or via a factory
    // keyed on AI_PROVIDER config) to change the backing model.
    { provide: AI_PROVIDER, useExisting: ClaudeProvider },
  ],
  exports: [AiGatewayService],
})
export class AiModule {}
