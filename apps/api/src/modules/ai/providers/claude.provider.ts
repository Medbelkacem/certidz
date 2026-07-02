import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env';
import type {
  AiCompletion,
  AiCompletionOptions,
  AiEmbedding,
  AiMessage,
  AiProvider,
} from '../ai.types';

/**
 * Claude (Anthropic) provider — SKELETON.
 *
 * The real implementation posts to the AI gateway / Anthropic Messages API,
 * but that HTTP call is intentionally not wired here so the codebase builds
 * and tests run fully offline and deterministically. Everything except the
 * network boundary (config wiring, message mapping, typed result, token
 * accounting shape) is real; the marked TODO is the only stub.
 */
@Injectable()
export class ClaudeProvider implements AiProvider {
  readonly name = 'claude';
  private readonly logger = new Logger(ClaudeProvider.name);

  private readonly apiKey?: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    // NOTE: the env schema exposes AI_API_KEY / AI_PROVIDER today. A production
    // deployment behind a gateway would add AI_GATEWAY_API_KEY + AI_MODEL; the
    // wiring reads from config either way (no direct process.env access).
    this.apiKey = this.config.get('AI_API_KEY', { infer: true });
    // TODO(prod): source the model id from config (e.g. AI_MODEL) once added.
    this.model = 'claude-sonnet-4-6';
  }

  async complete(
    messages: AiMessage[],
    opts: AiCompletionOptions = {},
  ): Promise<AiCompletion> {
    // TODO(prod): wire real gateway HTTP call.
    //   const res = await fetch(`${gatewayBaseUrl}/v1/messages`, {
    //     method: 'POST',
    //     headers: {
    //       'content-type': 'application/json',
    //       'x-api-key': this.apiKey,
    //       'anthropic-version': '2023-06-01',
    //     },
    //     body: JSON.stringify({
    //       model: this.model,
    //       max_tokens: opts.maxTokens ?? 1024,
    //       temperature: opts.temperature ?? 0.2,
    //       system: messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n'),
    //       messages: messages.filter(m => m.role !== 'system'),
    //     }),
    //   });
    // Until then, return a well-typed deterministic stub so callers compile
    // and behave predictably in tests.
    if (!this.apiKey) {
      this.logger.debug('AI_API_KEY not set — returning deterministic stub');
    }

    const content = opts.json
      ? this.stubJson(messages)
      : this.stubText(messages);

    return {
      content,
      model: this.model,
      provider: this.name,
      usage: {
        inputTokens: this.approxTokens(messages),
        outputTokens: this.approxTokens([{ role: 'assistant', content }]),
      },
      stub: true,
    };
  }

  async embed(text: string): Promise<AiEmbedding> {
    // TODO(prod): wire real gateway HTTP call (embeddings endpoint).
    // Deterministic pseudo-embedding derived from a hash of the input so that
    // identical text yields identical vectors and tests are stable.
    const digest = createHash('sha256').update(text).digest();
    const dims = 16;
    const vector = Array.from({ length: dims }, (_, i) =>
      Number(((digest[i % digest.length] / 255) * 2 - 1).toFixed(6)),
    );
    return { vector, model: `${this.model}-embed`, provider: this.name, stub: true };
  }

  // -- stub helpers ---------------------------------------------------------

  private stubText(messages: AiMessage[]): string {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    return [
      '[stub] CertiDZ AI is running without a live model connection.',
      'This deterministic placeholder confirms the request was well-formed.',
      lastUser
        ? `Received a ${lastUser.content.length}-char user prompt.`
        : 'No user message supplied.',
    ].join(' ');
  }

  private stubJson(_messages: AiMessage[]): string {
    // Shape mirrors the contract-review / risk-detection contracts so callers
    // that JSON.parse the result don't throw.
    return JSON.stringify({
      summary: '[stub] No live model connection.',
      findings: [],
      risks: [],
    });
  }

  /** Cheap token estimate (~4 chars/token) for usage accounting shape. */
  private approxTokens(messages: AiMessage[]): number {
    const chars = messages.reduce((n, m) => n + m.content.length, 0);
    return Math.ceil(chars / 4);
  }
}
