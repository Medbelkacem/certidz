# CertiDZ API — by HISN

Enterprise digital-trust platform API: e-signatures, PKI, identity
verification, document workflows, AI document intelligence, notifications,
webhooks and billing. Built with **NestJS 10**, **Prisma 6** (PostgreSQL),
**BullMQ** (Redis) and **Zod**-validated configuration.

---

## Running

### Prerequisites
- Node.js **>= 22**, `pnpm` (via `corepack enable`)
- PostgreSQL and Redis (BullMQ, rate-limiting, health checks)

### Local
```bash
corepack enable
pnpm install                # runs `prisma generate` via postinstall
cp .env.example .env        # then edit DATABASE_URL, REDIS_*, JWT_SECRET, …
pnpm prisma:migrate         # apply migrations
pnpm dev                    # watch mode
```
- API base URL: `http://localhost:${PORT}/api/v1`
- OpenAPI docs: `http://localhost:${PORT}/api/docs`

### Docker
```bash
docker build -t certidz-api -f apps/api/Dockerfile .
docker run --rm -p 4000:4000 \
  -e DATABASE_URL=... -e REDIS_HOST=... -e JWT_SECRET=... \
  certidz-api
```
The image is multi-stage (deps → build → runner), runs as the non-root
`node` user on `node:22-alpine`, `EXPOSE`s `4000`, and ships a `HEALTHCHECK`
against `/api/v1/health`.

### Configuration
All config is centralised and **Zod-validated** in `src/config/env.ts`; the
app refuses to boot on invalid env. Modules read config via
`ConfigService<Env, true>` — never `process.env` directly. Relevant keys:
`DATABASE_URL`, `REDIS_HOST/PORT/PASSWORD`, `JWT_SECRET`, `SMTP_URL`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AI_PROVIDER`, `AI_API_KEY`,
`IDENTITY_PROVIDER`.

---

## Module map

| Module           | Path                              | Responsibility |
|------------------|-----------------------------------|----------------|
| **auth**         | `src/modules/auth`                | Register/login (argon2id), JWT access + rotating refresh tokens with reuse detection, MFA (TOTP), local & JWT passport strategies |
| **identity**     | `src/modules/identity`            | KYC session lifecycle; pluggable provider adapter; deterministic mock provider; document/face/liveness scoring |
| **workflows**    | `src/modules/workflows`           | Workflow template CRUD, safe JSON condition evaluator, run engine, BullMQ advancement processor |
| **ai**           | `src/modules/ai`                  | Provider-agnostic AI gateway, prompt library with injection/PII guardrails, summarize/chat/contract-review |
| **notifications**| `src/modules/notifications`       | Channel-adapter dispatch (in-app + email), notification centre, BullMQ dispatch processor |
| **webhooks**     | `src/modules/webhooks`            | Webhook CRUD, HMAC-SHA256 signed + timestamped delivery, exponential-backoff retries via BullMQ |
| **billing**      | `src/modules/billing`             | Plan catalogue, subscription/invoice endpoints, usage metering + limit enforcement, payment-provider interface |
| **health**       | `src/modules/health`              | Liveness `/health` and readiness `/health/ready` (Postgres + Redis pings) |
| **audit**        | `src/modules/audit` *(existing)*  | Hash-chained, append-only audit log consumed via the `audit.record` event |

Security-relevant actions across the new modules emit the
`audit.record` event (`AUDIT_RECORD_EVENT`) with the `AuditRecordInput`
shape, which the existing `AuditListener` persists into the tamper-evident
chain.

---

## What's real vs `TODO(prod)`

**Real / production-shaped**
- Auth flows: argon2id hashing, refresh-token **rotation with reuse
  detection** (revokes the whole session family), session-aware JWT guard.
- Identity: full session state machine, deterministic hash-based mock scoring
  (stable tests), aggregate confidence + blocking risk flags, persistence.
- Workflows: **safe** JSON condition evaluator (no `eval`/`Function`, no
  prototype traversal), ordered run engine with branch/skip/wait/complete,
  queue-driven advancement.
- AI: provider-agnostic gateway + prompt templates with prompt-injection
  fences and PII-redaction guardrails; typed contract-review parsing.
- Notifications: channel-adapter pattern, in-app persistence, queue fan-out.
- Webhooks: HMAC-SHA256 signing over `${timestamp}.${body}`, constant-time
  verification, replay window, delivery rows, exponential-backoff retries.
- Billing: plan catalogue + **real usage-limit enforcement** against
  `UsageRecord` for the current period.
- Health: real Postgres (`$queryRaw`) and Redis (`PING`) probes.

**Stubbed at the network boundary (`// TODO(prod)`)**
- `ai/providers/claude.provider.ts` — returns a well-typed deterministic stub;
  the real gateway/Anthropic HTTP call is marked and not wired (offline tests).
- `notifications/channels/email.channel.ts` — logs in dev; real SMTP transport
  (`nodemailer`) is not wired (not yet a dependency).
- `billing/providers/stripe.provider.ts` — reads `STRIPE_*`; SDK calls marked.
- `ai-gateway` document text extraction & RAG retrieval — placeholder using
  document metadata until object-storage extraction + a vector index exist.

> The Claude, Stripe and email integrations deliberately avoid importing
> `@anthropic-ai/*`, `stripe` and `nodemailer` because they are not declared
> dependencies; wiring them is the only remaining prod work at those seams.

---

## Testing

```bash
pnpm test          # jest
pnpm test:cov      # with coverage
```
Notable unit tests (all offline, no DB/Redis required):
- `workflows/engine/condition.spec.ts` — condition evaluator (operators,
  composition, prototype-pollution safety, validation).
- `workflows/workflow-engine.spec.ts` — engine advance/branch/wait/complete
  with a mocked Prisma.
- `webhooks/signing.spec.ts` — HMAC sign/verify round-trip + replay rejection.
- `auth/auth.service.spec.ts` — register (argon2id), login (+ wrong-password),
  refresh **rotation and reuse detection**.
- `audit/audit.service.spec.ts` *(existing)* — hash-chain integrity.
