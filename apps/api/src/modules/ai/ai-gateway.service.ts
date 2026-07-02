import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AI_PROVIDER,
  type AiCompletion,
  type AiMessage,
  type AiProvider,
} from './ai.types';
import {
  buildChatPrompt,
  buildContractReviewPrompt,
  buildRiskDetectionPrompt,
  buildSummarizePrompt,
} from './prompts';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ContractFinding {
  clause: string;
  riskLevel: RiskLevel;
  rationale: string;
  recommendation: string;
}

export interface ContractReviewResult {
  summary: string;
  findings: ContractFinding[];
  model: string;
  provider: string;
  stub: boolean;
}

export interface SummaryResult {
  summary: string;
  model: string;
  provider: string;
  stub: boolean;
}

export interface ChatResult {
  answer: string;
  model: string;
  provider: string;
  stub: boolean;
}

const RISK_LEVELS: readonly RiskLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

/**
 * Feature-level gateway over an {@link AiProvider}. Modules call these
 * high-level methods; the concrete model provider is injected and never
 * referenced directly, so switching providers is a DI change only.
 */
@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) {}

  async summarizeDocument(
    orgId: string,
    documentId: string,
  ): Promise<SummaryResult> {
    const doc = await this.loadDocument(orgId, documentId);
    const messages = buildSummarizePrompt({
      title: doc.title,
      content: await this.extractText(orgId, documentId),
    });
    const result = await this.provider.complete(messages, { temperature: 0.2 });
    return this.toSummary(result);
  }

  async chatWithDocument(
    orgId: string,
    documentId: string,
    message: string,
    history: AiMessage[] = [],
  ): Promise<ChatResult> {
    await this.loadDocument(orgId, documentId);
    const contextChunks = await this.retrieveContext(
      orgId,
      documentId,
      message,
    );
    const messages = buildChatPrompt({
      question: message,
      contextChunks,
      history,
    });
    const result = await this.provider.complete(messages, { temperature: 0.3 });
    return {
      answer: result.content,
      model: result.model,
      provider: result.provider,
      stub: result.stub,
    };
  }

  async reviewContract(
    orgId: string,
    documentId: string,
    focus?: string[],
  ): Promise<ContractReviewResult> {
    const doc = await this.loadDocument(orgId, documentId);
    const messages = buildContractReviewPrompt({
      title: doc.title,
      content: await this.extractText(orgId, documentId),
      focus,
    });
    const result = await this.provider.complete(messages, {
      temperature: 0.1,
      json: true,
    });
    return this.parseContractReview(result);
  }

  /** Structured risk scan — exposed for workflow/automation callers. */
  async detectRisks(
    orgId: string,
    documentId: string,
    categories?: string[],
  ): Promise<AiCompletion> {
    await this.loadDocument(orgId, documentId);
    const messages = buildRiskDetectionPrompt({
      content: await this.extractText(orgId, documentId),
      categories,
    });
    return this.provider.complete(messages, { temperature: 0.1, json: true });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async loadDocument(orgId: string, documentId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, orgId },
      select: { id: true, title: true, description: true },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  /**
   * Returns the plain-text content of a document for the model.
   * TODO(prod): download from object storage and run OCR / PDF text
   * extraction (+ a deterministic PII-redaction pass) before returning.
   * Until then we surface the available metadata so prompts are well-formed.
   */
  private async extractText(
    orgId: string,
    documentId: string,
  ): Promise<string> {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, orgId },
      select: { title: true, description: true },
    });
    return [doc?.title, doc?.description].filter(Boolean).join('\n\n') || '';
  }

  /**
   * Retrieve context passages for RAG.
   * TODO(prod): embed the question and query a vector index of document
   * chunks. Placeholder returns the document metadata as a single chunk.
   */
  private async retrieveContext(
    orgId: string,
    documentId: string,
    _question: string,
  ): Promise<string[]> {
    const text = await this.extractText(orgId, documentId);
    return text ? [text] : [];
  }

  private toSummary(result: AiCompletion): SummaryResult {
    return {
      summary: result.content,
      model: result.model,
      provider: result.provider,
      stub: result.stub,
    };
  }

  private parseContractReview(result: AiCompletion): ContractReviewResult {
    let summary = '';
    let findings: ContractFinding[] = [];
    try {
      const parsed = JSON.parse(result.content) as {
        summary?: unknown;
        findings?: unknown;
      };
      summary = typeof parsed.summary === 'string' ? parsed.summary : '';
      findings = Array.isArray(parsed.findings)
        ? parsed.findings
            .map((f) => this.coerceFinding(f))
            .filter((f): f is ContractFinding => f !== null)
        : [];
    } catch {
      this.logger.warn('Contract review returned non-JSON; returning empty findings');
    }
    return {
      summary,
      findings,
      model: result.model,
      provider: result.provider,
      stub: result.stub,
    };
  }

  private coerceFinding(value: unknown): ContractFinding | null {
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const f = value as Record<string, unknown>;
    const riskLevel = RISK_LEVELS.includes(f.riskLevel as RiskLevel)
      ? (f.riskLevel as RiskLevel)
      : 'MEDIUM';
    return {
      clause: typeof f.clause === 'string' ? f.clause : 'unknown',
      riskLevel,
      rationale: typeof f.rationale === 'string' ? f.rationale : '',
      recommendation:
        typeof f.recommendation === 'string' ? f.recommendation : '',
    };
  }
}
