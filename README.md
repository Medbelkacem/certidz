# CertiDZ by HISN

> **The Trusted AI-Powered Digital Trust Platform for Algeria and Africa.**

CertiDZ is an enterprise-grade SaaS platform for digital trust: electronic, advanced, and qualified digital signatures; digital identity verification; PKI & certificate lifecycle management; trusted document management; AI-powered document intelligence; workflow automation; and compliance management — built for the Algerian market (Law 15-04, eIDAS-ready) and designed to scale across Africa.

---

## Monorepo Layout

```
certidz/
├── apps/
│   ├── web/          # Next.js 15 frontend (marketing site + app dashboard)
│   └── api/          # NestJS backend (REST /api/v1 + Swagger, modular monolith)
├── packages/
│   └── ui/           # Shared design-system components (@certidz/ui)
├── docs/
│   ├── product/      # PRD, roadmap, testing strategy, user & admin guides
│   ├── architecture/ # System, database, API, security/PKI, AI, frontend architecture
│   └── operations/   # Deployment, monitoring, disaster recovery, runbooks
├── infra/
│   ├── k8s/          # Kustomize base + staging/production overlays
│   ├── terraform/    # IaC modules (network, k8s, database, storage, monitoring)
│   ├── monitoring/   # Prometheus rules + Grafana dashboards
│   └── nginx/        # Hardened reverse-proxy config for single-VM deployments
├── .github/workflows # CI: lint, typecheck, test, build, SAST, secret scan, Docker
└── docker-compose.yml# Local dev stack: Postgres, Redis, Elasticsearch, MinIO, Mailpit
```

## Quick Start (Development)

Prerequisites: **Node 22+**, **pnpm 9+**, **Docker**.

```bash
# 1. Start infrastructure services
docker compose up -d postgres redis elasticsearch minio mailpit

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env    # fill in secrets

# 4. Set up the database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Run everything (web on :3000, api on :4000)
pnpm dev
```

- Web app: http://localhost:3000
- API + Swagger: http://localhost:4000/api/docs
- MinIO console: http://localhost:9001 · Mailpit inbox: http://localhost:8025

## Platform Modules

| Module | Highlights |
|---|---|
| **Authentication** | Email + OAuth (Google/Microsoft/Apple), TOTP MFA, WebAuthn/passkeys, refresh-token rotation with reuse detection, session & device management |
| **Digital Identity** | Document OCR (passport/CIN/license), face match, liveness, NFC read, confidence scoring, risk analysis |
| **Digital Signature** | Simple / Advanced / Qualified signatures, PAdES·XAdES·CAdES, RFC 3161 timestamps, LTV, sequential & parallel signing, QR verification |
| **PKI & Certificates** | CA hierarchy, X.509 issuance, revocation (CRL/OCSP), renewal, HSM integration via PKCS#11 |
| **Documents** | Versioning, tags/folders, envelope encryption at rest, retention policies, semantic + OCR search |
| **Workflows** | Approval chains, conditional logic, escalations, templates, analytics |
| **AI Intelligence** | Document chat (RAG), contract review, clause comparison, risk & fraud detection, summarization, FR/AR/EN translation |
| **Compliance** | Hash-chained immutable audit trail, consent management, eIDAS-ready evidence, GDPR/ISO 27001 alignment |
| **Administration** | Multi-tenant orgs, RBAC permission matrix, billing (Stripe/PayPal/bank transfer), API keys, webhooks, feature flags |

## Documentation Index

| Area | Documents |
|---|---|
| Product | [PRD](docs/product/PRD.md) · [Roadmap](docs/product/ROADMAP.md) · [Testing Strategy](docs/product/TESTING-STRATEGY.md) · [User Docs](docs/product/USER-DOCUMENTATION.md) · [Admin Guide](docs/product/ADMIN-GUIDE.md) |
| Architecture | [System](docs/architecture/SYSTEM-ARCHITECTURE.md) · [Database](docs/architecture/DATABASE.md) · [API Spec](docs/architecture/API-SPECIFICATION.md) · [Security & PKI](docs/architecture/SECURITY-ARCHITECTURE.md) · [AI](docs/architecture/AI-ARCHITECTURE.md) · [Frontend](docs/architecture/FRONTEND-ARCHITECTURE.md) |
| Operations | [Deployment](docs/operations/DEPLOYMENT.md) · [Monitoring](docs/operations/MONITORING.md) · [Disaster Recovery](docs/operations/DISASTER-RECOVERY.md) · [Runbooks](docs/operations/RUNBOOKS.md) |

## Engineering Principles

- **Clean Architecture + DDD** — bounded contexts (Identity & Access, Signing, Trust Services, Documents, Workflow, AI, Billing, Audit) as NestJS modules in a modular monolith, with a documented extraction path to microservices.
- **Zero Trust security** — argon2id, AES-256-GCM envelope encryption with per-tenant keys, Postgres RLS tenant isolation, OWASP Top 10 mitigations, CSP/secure headers, rate limiting.
- **Tamper-evident audit** — append-only, hash-chained audit events suitable as legal evidence.
- **Event-driven where it pays** — BullMQ queues for sending, webhooks, notifications, workflow runs; domain event catalog ready for NATS/Kafka at scale.
- **Sovereign-deployable** — full on-prem Kubernetes path for government clients; HSM-backed qualified signatures via the national CA.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run web + api in watch mode |
| `pnpm build` | Build all workspaces |
| `pnpm test` | Run unit tests |
| `pnpm lint` / `pnpm typecheck` | Static checks |
| `pnpm db:migrate` / `db:seed` | Prisma migrations & seed data |

## License

Proprietary — © HISN. All rights reserved.
