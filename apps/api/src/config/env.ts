import { z } from 'zod';

/**
 * Environment schema — the single source of truth for configuration.
 * All modules must read configuration through `ConfigService<Env, true>`;
 * direct `process.env` access is forbidden outside this file.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis (BullMQ, caching, rate limiting)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((o) => o.trim()).filter(Boolean)),

  // Object storage (S3-compatible: AWS S3, MinIO…)
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('eu-west-3'),
  S3_BUCKET: z.string().default('certidz-dev'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  // Dev CA (software PKI — replaced by HSM-backed CA in production)
  DEV_CA_ENABLED: z.coerce.boolean().default(true),

  // WebAuthn relying party
  WEBAUTHN_RP_ID: z.string().default('localhost'),
  WEBAUTHN_RP_NAME: z.string().default('CertiDZ'),
  WEBAUTHN_ORIGIN: z.string().url().default('http://localhost:3000'),

  // Rate limiting
  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),

  // Observability
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // External providers (all optional in dev — adapters fall back to stubs)
  SMTP_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  IDENTITY_PROVIDER: z.enum(['mock']).default('mock'),
  AI_PROVIDER: z.enum(['stub', 'anthropic', 'openai']).default('stub'),
  AI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Used by ConfigModule.forRoot({ validate }) — throws on invalid env. */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
