import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiGatewayService } from './ai-gateway.service';
import { ChatDto } from './dto/chat.dto';
import { ContractReviewDto } from './dto/contract-review.dto';
import { SummarizeDto } from './dto/summarize.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiParam({ name: 'orgId' })
@Controller('orgs/:orgId/ai')
export class AiController {
  constructor(private readonly ai: AiGatewayService) {}

  @Post('summarize')
  @ApiOperation({ summary: 'Summarise a document' })
  @ApiOkResponse({ description: 'Structured summary result' })
  summarize(@Param('orgId') orgId: string, @Body() dto: SummarizeDto) {
    return this.ai.summarizeDocument(orgId, dto.documentId);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Ask a question about a document (RAG-grounded)' })
  @ApiOkResponse({ description: 'Grounded answer' })
  chat(@Param('orgId') orgId: string, @Body() dto: ChatDto) {
    return this.ai.chatWithDocument(orgId, dto.documentId, dto.message);
  }

  @Post('contract-review')
  @ApiOperation({
    summary: 'Review a contract and return typed risk findings',
  })
  @ApiOkResponse({ description: 'Summary + findings[{clause,riskLevel,...}]' })
  contractReview(
    @Param('orgId') orgId: string,
    @Body() dto: ContractReviewDto,
  ) {
    return this.ai.reviewContract(orgId, dto.documentId, dto.focus);
  }
}
