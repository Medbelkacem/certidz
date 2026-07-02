# Contributing to CertiDZ by HISN

Thank you for helping build Algeria's digital-trust platform. This guide covers the workflow, standards, and expectations for contributors.

## Development Workflow

1. **Branch** from `main` using the convention `type/short-description` (`feat/parallel-signing`, `fix/ocsp-cache`, `docs/pki-runbook`, `chore/deps`).
2. **Develop** against the local stack (`docker compose up -d`, then `pnpm dev`). See the root `README.md` for setup.
3. **Test** — every change must keep `pnpm lint`, `pnpm typecheck`, and `pnpm test` green. New logic ships with tests (see `docs/product/TESTING-STRATEGY.md`).
4. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `security:`.
5. **Open a PR** into `main`. CI (lint, typecheck, test, build, SAST, secret scan, Docker build) must pass. At least one review is required; security-sensitive areas (auth, crypto, PKI, audit) require a second reviewer.

## Code Standards

- **TypeScript strict everywhere.** Avoid `any`; prefer precise types and Zod/class-validator at boundaries.
- **Clean Architecture & DDD.** Keep domain logic in services, not controllers. Respect bounded-context module boundaries (see `docs/architecture/SYSTEM-ARCHITECTURE.md`).
- **Never log secrets or PII.** The logger redacts auth headers/cookies — do not defeat it.
- **Security-critical code** (signing, key handling, token rotation, audit hash-chain, RBAC) changes require tests proving the invariant and a note in the PR describing the threat considered.
- **Formatting** is enforced by Prettier (`pnpm format`) and ESLint.

## Commit Signing & Secrets

- All commits to `main` should be GPG/SSH-signed.
- Never commit `.env`, private keys, certificates, or credentials. `gitleaks` runs in CI and locally via pre-commit is encouraged. Test fixtures with throwaway keys belong under `**/test-fixtures/`.

## Reporting Security Issues

Do **not** open public issues for vulnerabilities. Email `security@certidz.dz` with details; see `SECURITY.md` for our disclosure policy and PGP key.

## Documentation

Behavioural or architectural changes update the relevant docs under `docs/`. Docs are part of the definition of done, not an afterthought.
