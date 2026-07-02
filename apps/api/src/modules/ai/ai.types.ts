/** Roles supported by the chat-style completion interface. */
export type AiRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface AiCompletionOptions {
  /** Sampling temperature (0 = deterministic). */
  temperature?: number;
  /** Hard cap on generated tokens. */
  maxTokens?: number;
  /**
   * When set, the provider is asked to return strict JSON matching this
   * (informal) shape hint. Callers still validate the parsed result.
   */
  json?: boolean;
  /** Correlation id for tracing/observability. */
  requestId?: string;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AiCompletion {
  /** Raw text (or JSON string when `json` was requested). */
  content: string;
  model: string;
  provider: string;
  usage: AiUsage;
  /** True when the response is a compile-time stub, not a real model call. */
  stub: boolean;
}

export interface AiEmbedding {
  vector: number[];
  model: string;
  provider: string;
  stub: boolean;
}

/**
 * Provider-agnostic LLM interface. The gateway depends only on this contract;
 * concrete providers (Claude, OpenAI, a self-hosted model…) implement it.
 */
export interface AiProvider {
  readonly name: string;
  complete(
    messages: AiMessage[],
    opts?: AiCompletionOptions,
  ): Promise<AiCompletion>;
  embed(text: string): Promise<AiEmbedding>;
}

/** DI token for the active AI provider. */
export const AI_PROVIDER = 'AI_PROVIDER_ADAPTER';
