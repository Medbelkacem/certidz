# CertiDZ API Specification

**CertiDZ by HISN — The Trusted AI-Powered Digital Trust Platform for Algeria and Africa**

| | |
|---|---|
| **Document** | API-SPECIFICATION.md |
| **Version** | 1.4.0 |
| **Status** | Approved — Production |
| **Owner** | Platform Architecture (CTO Office) |
| **Last updated** | 2026-07-02 |
| **Applies to** | REST API v1, GraphQL Dashboard API v1, Webhooks v1 |
| **Compliance context** | eIDAS-ready, Algerian Law 15-04 (electronic signature & certification), Law 18-07 (personal data), GDPR |

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Global Conventions](#2-global-conventions)
3. [REST Resources](#3-rest-resources)
   - 3.1 [Authentication](#31-authentication)
   - 3.2 [Users](#32-users)
   - 3.3 [Organizations](#33-organizations)
   - 3.4 [Documents](#34-documents)
   - 3.5 [Envelopes](#35-envelopes)
   - 3.6 [Signatures](#36-signatures)
   - 3.7 [Verification](#37-verification)
   - 3.8 [Certificates](#38-certificates)
   - 3.9 [Identity Verification](#39-identity-verification)
   - 3.10 [Workflows](#310-workflows)
   - 3.11 [AI Document Intelligence](#311-ai-document-intelligence)
   - 3.12 [Webhooks](#312-webhooks)
   - 3.13 [Audit Trail](#313-audit-trail)
   - 3.14 [API Keys](#314-api-keys)
   - 3.15 [Billing](#315-billing)
4. [GraphQL Dashboard API](#4-graphql-dashboard-api)
5. [Webhook Event Catalog & Delivery](#5-webhook-event-catalog--delivery)

---

## 1. API Overview

### 1.1 Base URL

```
https://api.certidz.dz/v1
```

Regional / environment endpoints:

| Environment | Base URL | Notes |
|---|---|---|
| Production (DZ) | `https://api.certidz.dz/v1` | Primary. Data residency: Algiers (DC1) + Oran (DC2 DR) |
| Sandbox | `https://sandbox.api.certidz.dz/v1` | Isolated tenant data, test CA, watermarked PDFs, no legal value |
| Public verification | `https://verify.certidz.dz/v1` | Unauthenticated verification endpoints only |

### 1.2 Versioning Policy

- **URI major versioning.** The major version is embedded in the path (`/v1`). A breaking change requires a new major version (`/v2`) — we never break `/v1` in place.
- **Additive changes are non-breaking** and shipped continuously without a version bump: new endpoints, new optional request fields, new response fields, new enum values on fields explicitly documented as *open enums*, new webhook event types. **Clients MUST tolerate unknown JSON fields and unknown open-enum values.**
- **Breaking changes** (removal/rename of fields, semantic changes, closed-enum changes, auth changes) only occur in a new major version.
- **Deprecation & sunset.** Deprecated endpoints/fields respond with:

```http
Deprecation: true
Sunset: Sat, 30 Jan 2027 00:00:00 GMT
Link: <https://developers.certidz.dz/changelog/v1-envelope-legacy-fields>; rel="deprecation"
```

  Minimum deprecation window: **12 months** for GA endpoints, 3 months for beta (`/v1/beta/*`).
- Every response carries `X-CertiDZ-Api-Version: 2026-06-15` (the rolling minor build tag, informational only).

### 1.3 Content Types

| Direction | Content type |
|---|---|
| Request bodies | `application/json; charset=utf-8` (UTF-8 mandatory — full Arabic support) |
| File upload metadata | JSON; binary content goes to object storage via **presigned URLs** (§3.4), never through the API |
| Multipart exceptions | `multipart/form-data` accepted ONLY on `/verify/document` and `/identity/verifications/{id}/documents` for ≤ 25 MB payloads |
| Responses | `application/json; charset=utf-8`; downloads: `application/pdf`, `application/pkcs7-mime`, `application/zip` |
| Streaming (AI) | `text/event-stream` (SSE, §3.11) |

Dates are **RFC 3339 / ISO 8601 UTC** (`2026-07-02T14:30:00Z`). Monetary amounts are integer minor units + ISO 4217 currency (`{ "amount": 250000, "currency": "DZD" }` = 2 500,00 DZD). Identifiers are prefixed ULIDs: `env_01J1XCV9K2M3N4P5Q6R7S8T9U0`, `doc_…`, `org_…`, `usr_…`, `cert_…`, `whk_…`.

### 1.4 Authentication Schemes

| Scheme | Header | Use case | Lifetime |
|---|---|---|---|
| **Bearer JWT (access token)** | `Authorization: Bearer eyJhbGciOiJFUzI1NiIs...` | Interactive users (dashboard, mobile) | 15 min access / 30 d refresh (rotating, one-time-use, reuse detection revokes the family) |
| **API key** | `X-Api-Key: cdz_live_sk_9f2a...` | Server-to-server integrations | Until revoked; max 2 active keys per name for rotation overlap |
| **Signing-session token** | `Authorization: Bearer <session JWT>` | External signer ceremony UI (no CertiDZ account required) | 24 h, single envelope+signer scope |
| **Webhook HMAC** | `X-CertiDZ-Signature` | Outbound event authenticity (§5.3) | Per delivery |

**JWT claims (access token):**

```json
{
  "iss": "https://auth.certidz.dz",
  "sub": "usr_01J1X9A8B7C6D5E4F3G2H1J0K9",
  "org": "org_01J1X8Z7Y6X5W4V3U2T1S0R9Q8",
  "roles": ["org:admin"],
  "scopes": ["envelopes:write", "documents:read"],
  "tenant_status": "active",
  "amr": ["pwd", "totp"],
  "exp": 1751467800,
  "iat": 1751466900,
  "jti": "3f6c1a9e-..."
}
```

Tokens are ES256-signed; JWKS at `https://auth.certidz.dz/.well-known/jwks.json` (24 h cache, `kid` rotation every 90 days).

**Scoped API keys.** Keys carry an explicit scope set assigned at creation (§3.14). Format: `cdz_{live|test}_sk_{40 base62 chars}`. Only the SHA-256 hash is stored server-side; the plaintext is shown once. Common scopes:

```
envelopes:read  envelopes:write  documents:read  documents:write
certificates:read  certificates:write  identity:write  identity:read
verify:read  webhooks:manage  audit:read  ai:invoke  billing:read
```

A request exceeding key scope returns `403 PERMISSION_DENIED` with `details.missingScope`.

### 1.5 Tenancy Resolution

CertiDZ is multi-tenant. Every authenticated request resolves to exactly one **organization context**:

1. **Default:** the `org` claim in the JWT, or the organization that owns the API key.
2. **Override:** users who belong to multiple organizations may send `X-Organization-Id: org_01J1...`. The override is honored **only if** the caller has an active membership in that org; otherwise `403 PERMISSION_DENIED` (never `404` — membership existence is not leaked, the error is identical for "no such org" and "not a member").
3. API keys are org-bound and **cannot** override tenancy; `X-Organization-Id` mismatching the key's org yields `403`.
4. If the resolved tenant is suspended (billing or compliance hold), all endpoints except `/billing/*`, `/auth/*` and `/users/me` return `403 TENANT_SUSPENDED`.

The resolved org is echoed back on every response: `X-Organization-Id: org_01J1X8Z7Y6X5W4V3U2T1S0R9Q8`.

### 1.6 Localization

```http
Accept-Language: fr-DZ, fr;q=0.9, ar;q=0.8, en;q=0.5
```

Supported: **`fr` (default), `ar`, `en`**. Affects: `error.message` (human strings only — `error.code` is stable), email/SMS notifications triggered by the request, generated PDF artifacts (certificate of completion, audit summary), and signer ceremony UI language when creating signing sessions. Arabic responses are fully RTL-safe UTF-8; PDF generation embeds Amiri/Noto Naskh fonts. The applied locale is returned in `Content-Language`.

---

## 2. Global Conventions

### 2.1 Error Envelope

Every non-2xx response uses **one single JSON shape** — no exceptions, including 500s:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "La requête contient 2 champs invalides.",
    "details": [
      { "field": "signers[0].email", "issue": "INVALID_FORMAT", "message": "Adresse e-mail invalide." },
      { "field": "expiresAt", "issue": "PAST_DATE", "message": "La date d'expiration doit être future." }
    ],
    "traceId": "req_01J1XD4E5F6G7H8J9K0M1N2P3Q",
    "docsUrl": "https://developers.certidz.dz/errors/VALIDATION_FAILED"
  }
}
```

- `code` — machine-stable, SCREAMING_SNAKE_CASE, never localized, never removed within a major version.
- `message` — human-readable, localized per `Accept-Language`.
- `details` — optional structured context; array for validation errors, object otherwise (e.g. `{ "retryAfterSeconds": 42 }`).
- `traceId` — correlates with our distributed tracing; **always include it in support tickets**. Also echoed as `X-Trace-Id` on every response, success or failure.
- `docsUrl` — deep link to the error catalog entry.

### 2.2 Error Code Catalog

| Code | HTTP | Meaning / typical trigger |
|---|---|---|
| `VALIDATION_FAILED` | 400 | Body/query/path failed schema validation; see `details[]` |
| `MALFORMED_REQUEST` | 400 | Unparseable JSON, wrong content type, oversized body |
| `UNAUTHENTICATED` | 401 | Missing/expired/invalid credentials; JWT signature failure |
| `TOKEN_EXPIRED` | 401 | Access token expired (client should refresh, not re-login) |
| `MFA_REQUIRED` | 401 | Login step-up: password OK, second factor pending (`details.mfaToken`) |
| `PERMISSION_DENIED` | 403 | Authenticated but lacking role/scope/membership |
| `TENANT_SUSPENDED` | 403 | Organization suspended (billing/compliance); `details.reason` |
| `IP_NOT_ALLOWED` | 403 | Request origin outside the API key's IP allowlist |
| `RESOURCE_NOT_FOUND` | 404 | Resource absent **or not visible in the resolved tenant** |
| `METHOD_NOT_ALLOWED` | 405 | Verb not supported on path |
| `CONFLICT` | 409 | State conflict: duplicate email, envelope not in required state, optimistic-lock `version` mismatch |
| `IDEMPOTENCY_CONFLICT` | 409 | Same `Idempotency-Key` reused with a **different** payload (§2.5) |
| `IDEMPOTENCY_IN_FLIGHT` | 409 | Original request with this key is still processing; retry with backoff |
| `PRECONDITION_FAILED` | 412 | `If-Match` ETag mismatch on concurrent update |
| `PAYLOAD_TOO_LARGE` | 413 | Upload beyond plan limit (`details.maxBytes`) |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | File format not accepted for the operation |
| `SIGNATURE_INVALID` | 422 | Cryptographic failure: broken integrity, untrusted chain, revoked cert, bad timestamp |
| `CERTIFICATE_REVOKED` | 422 | Operation requires a valid cert but the referenced cert is revoked |
| `IDENTITY_CHECK_FAILED` | 422 | KYC pipeline rejected the evidence (see `details.checks`) |
| `ENVELOPE_LOCKED` | 423 | Envelope locked by an active signing session |
| `RATE_LIMITED` | 429 | Quota exceeded (§2.6); honor `Retry-After` |
| `QUOTA_EXCEEDED` | 429 | Monthly plan quota exhausted (envelopes, AI tokens); `details.quota` |
| `INTERNAL` | 500 | Unexpected server fault — safe to retry idempotent calls |
| `PROVIDER_UNAVAILABLE` | 502 | Upstream dependency down (TSA, OCSP responder, SMS gateway); `details.provider` |
| `SERVICE_UNAVAILABLE` | 503 | Maintenance window or overload shedding |

### 2.3 Pagination, Filtering, Sorting, Fieldsets, Expansion

**Cursor pagination** on every list endpoint (no offsets — stable under concurrent writes):

```http
GET /v1/envelopes?limit=25&cursor=eyJpZCI6ImVudl8wMUoxLi4uIn0
```

| Param | Default | Max | Notes |
|---|---|---|---|
| `limit` | 25 | 100 | |
| `cursor` | — | — | Opaque, base64url; from `pagination.nextCursor`. Do not construct manually |

Response envelope for all lists:

```json
{
  "data": [ { "...": "resource objects" } ],
  "pagination": { "nextCursor": "eyJpZCI6ImVudl8wMUoxWEYuLi4ifQ", "hasMore": true, "limit": 25 }
}
```

**Filtering** — flat query params, ANDed. Multi-value = comma-separated OR. Date range suffixes `After`/`Before` (exclusive):

```http
GET /v1/envelopes?status=sent,delivered&createdAfter=2026-06-01T00:00:00Z&signerEmail=a.benali@sonelgaz.dz
```

**Sorting** — `?sort=-createdAt` (`-` prefix = descending; default `-createdAt`). Multiple: `?sort=-priority,createdAt`. Sortable fields are listed per resource; unknown fields → `VALIDATION_FAILED`.

**Sparse fieldsets** — `?fields=id,status,title,createdAt` (top-level fields; `id` always included).

**Expansion** — related sub-resources are collapsed to IDs by default; opt in with `?expand=`:

```http
GET /v1/envelopes/env_01J1.../?expand=signers,documents,auditSummary
```

Nested expansion up to 2 levels: `?expand=signers.identityVerification`. Unexpandable combinations return `VALIDATION_FAILED` listing supported expansions.

### 2.4 Concurrency Control

Mutable resources return `ETag`. `PATCH`/`PUT`/`DELETE` accept `If-Match`; mismatch → `412 PRECONDITION_FAILED`. Envelope mutation additionally requires the `version` integer in the body (optimistic lock, mismatch → `409 CONFLICT`).

### 2.5 Idempotency Keys

All `POST` endpoints accept (and side-effectful POSTs **require** for API-key callers):

```http
Idempotency-Key: 7d4c1f2e-9a3b-4c8d-b1e0-6f5a4d3c2b1a
```

Semantics:

1. Key = client-generated, ≤ 255 chars, unique per logical operation (UUIDv4 recommended). Scoped per `(organization, endpoint, key)`.
2. **First request:** processed normally; we persist `{key, endpoint, sha256(canonical request body), response status, response body}`.
3. **Replay with identical payload:** the **stored response is returned verbatim** (same status/body), with `Idempotency-Replayed: true`. No side effects re-execute.
4. **Replay with different payload:** `409 IDEMPOTENCY_CONFLICT` — the key is bound to the original payload hash. Never silently execute.
5. **Replay while original is still executing:** `409 IDEMPOTENCY_IN_FLIGHT` with `Retry-After`.
6. **Retention: 24 hours.** After expiry the key is forgotten and a replay executes as a brand-new request.
7. Only `2xx` and `4xx` outcomes are stored. `5xx`/network failures are NOT recorded — retrying the same key after a 500 re-executes safely.

### 2.6 Rate Limits & Quotas

Enforced in Redis (sliding-window per key/token + monthly counters). Limits are per organization; per-endpoint burst caps may be lower (documented inline).

| Plan | API req/min | Burst (10 s) | Envelopes / month | AI tokens / month | Identity verifications / month | Webhook endpoints |
|---|---|---|---|---|---|---|
| **Free** | 60 | 20 | 10 | 50 000 | 5 | 1 |
| **Starter** | 300 | 100 | 100 | 500 000 | 50 | 3 |
| **Business** | 1 200 | 400 | 1 000 | 3 000 000 | 500 | 10 |
| **Enterprise** | 6 000+ (contractual) | 2 000 | Custom | Custom | Custom | 25 |

Headers on **every** response:

```http
X-RateLimit-Limit: 1200
X-RateLimit-Remaining: 1143
X-RateLimit-Reset: 1751467860
```

On breach:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 31
```
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Limite de débit atteinte. Réessayez dans 31 secondes.",
    "details": { "limit": 1200, "windowSeconds": 60, "retryAfterSeconds": 31 },
    "traceId": "req_01J1XDN8Q9R0S1T2U3V4W5X6Y7",
    "docsUrl": "https://developers.certidz.dz/errors/RATE_LIMITED"
  }
}
```

Monthly quota exhaustion returns `429 QUOTA_EXCEEDED` with `details.quota = { "metric": "envelopes", "limit": 100, "used": 100, "resetsAt": "2026-08-01T00:00:00Z" }`. Live usage: `GET /billing/usage` (§3.15).

---

## 3. REST Resources

> Permission column legend — `public`: no auth; `user`: any authenticated member; `admin`: org admin role; `owner`: org owner; `signer-session`: signing-session token; `key:<scope>`: API key scope. JWT users need the equivalent scope through their role.

### 3.1 Authentication

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Create user account (+ optional new organization) |
| POST | `/auth/login` | public | Password login → tokens, or MFA challenge |
| POST | `/auth/refresh` | public (refresh token) | Rotate refresh token, mint new access token |
| POST | `/auth/logout` | user | Revoke current refresh-token family |
| POST | `/auth/email/verify` | public | Confirm email with one-time token |
| POST | `/auth/email/resend` | public | Re-send verification email (rate: 3/h) |
| POST | `/auth/password/forgot` | public | Send reset link (always 202, no user enumeration) |
| POST | `/auth/password/reset` | public | Set new password with reset token; revokes all sessions |
| POST | `/auth/mfa/totp/enroll` | user | Begin TOTP enrollment → secret + otpauth URI |
| POST | `/auth/mfa/totp/activate` | user | Confirm first TOTP code → recovery codes |
| DELETE | `/auth/mfa/totp` | user (fresh auth ≤ 5 min) | Disable TOTP |
| POST | `/auth/mfa/verify` | public (`mfaToken`) | Complete MFA step of login |
| POST | `/auth/webauthn/register/options` | user | Get WebAuthn creation options (challenge) |
| POST | `/auth/webauthn/register/verify` | user | Verify attestation, store passkey |
| POST | `/auth/webauthn/login/options` | public | Get assertion options |
| POST | `/auth/webauthn/login/verify` | public | Verify assertion → tokens |
| GET | `/auth/oauth/{provider}/authorize` | public | Redirect to provider (`google`, `microsoft`); **PKCE S256 required** |
| POST | `/auth/oauth/{provider}/callback` | public | Exchange `code` + `code_verifier` → tokens |

**`POST /auth/login`** — request:

```json
{
  "email": "amina.benali@sonelgaz.dz",
  "password": "correct-horse-battery-staple-31",
  "deviceName": "MacBook Pro — Direction Juridique"
}
```

Response `200` when MFA is enabled (step-up required):

```json
{
  "status": "MFA_REQUIRED",
  "mfaToken": "mfat_01J1XDQ2W3E4R5T6Y7U8I9O0P1",
  "methods": ["totp", "webauthn"],
  "expiresAt": "2026-07-02T14:40:00Z"
}
```

**`POST /auth/mfa/verify`** — request / response:

```json
{ "mfaToken": "mfat_01J1XDQ2W3E4R5T6Y7U8I9O0P1", "method": "totp", "code": "482913" }
```

```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJFUzI1NiIsImtpZCI6ImNkei0yMDI2LTA2In0.eyJzdWIiOiJ1c3JfMDFKMVg5QThCN0M2RDVFNEYzRzJIMUowSzkiLCJvcmciOiJvcmdfMDFKMVg4WjdZNlg1VzRWM1UyVDFTMFI5UTgifQ.MEUCIQ...",
  "expiresIn": 900,
  "refreshToken": "cdz_rt_9Kk2P...redacted...",
  "user": {
    "id": "usr_01J1X9A8B7C6D5E4F3G2H1J0K9",
    "email": "amina.benali@sonelgaz.dz",
    "fullName": "Amina Benali",
    "defaultOrganizationId": "org_01J1X8Z7Y6X5W4V3U2T1S0R9Q8"
  }
}
```

**`POST /auth/refresh`** — rotating refresh: each refresh token is single-use; presenting an already-consumed token from the same family triggers **family-wide revocation** (theft detection) and a `security.session.revoked` audit event.

```json
{ "refreshToken": "cdz_rt_9Kk2P...redacted..." }
```
```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJFUzI1NiIs...",
  "expiresIn": 900,
  "refreshToken": "cdz_rt_4Fm8Q...new-rotated-token..."
}
```

**`POST /auth/register`** — request:

```json
{
  "email": "karim.meziane@cevital.dz",
  "password": "Tassili#Hoggar#2026!",
  "fullName": "Karim Meziane",
  "locale": "fr",
  "organization": { "name": "Cevital SPA", "country": "DZ" },
  "acceptedTerms": true
}
```

Response `201`: user object with `emailVerified: false`; a verification email is sent. Login is allowed but envelope sending is blocked until verification.

**OAuth PKCE flow** — `GET /auth/oauth/google/authorize?redirect_uri=https://app.certidz.dz/oauth/done&code_challenge=<S256>&code_challenge_method=S256&state=<random>` → 302 to provider. Then:

```json
POST /auth/oauth/google/callback
{ "code": "4/0AY0e-g5...", "codeVerifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk", "state": "afe3c1..." }
```

Returns the same token payload as login (or `MFA_REQUIRED` if the linked account enforces MFA).

### 3.2 Users

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| GET | `/users/me` | user | Current user profile + memberships |
| PATCH | `/users/me` | user | Update profile (name, locale, phone, avatar) |
| PATCH | `/users/me/password` | user (fresh auth) | Change password (revokes other sessions) |
| GET | `/users/me/sessions` | user | List active sessions/devices |
| DELETE | `/users/me/sessions/{sessionId}` | user | Revoke one session |
| DELETE | `/users/me/sessions` | user | Revoke all sessions except current |
| GET | `/users/me/signature-appearance` | user | Saved visual signature (drawn/typed/uploaded) |
| PUT | `/users/me/signature-appearance` | user | Replace visual signature |

**`GET /users/me`** — response:

```json
{
  "id": "usr_01J1X9A8B7C6D5E4F3G2H1J0K9",
  "email": "amina.benali@sonelgaz.dz",
  "emailVerified": true,
  "fullName": "Amina Benali",
  "phone": "+213661234567",
  "locale": "fr",
  "timezone": "Africa/Algiers",
  "mfa": { "totp": true, "webauthn": true, "recoveryCodesRemaining": 8 },
  "memberships": [
    { "organizationId": "org_01J1X8Z7Y6X5W4V3U2T1S0R9Q8", "organizationName": "Sonelgaz", "role": "admin", "default": true },
    { "organizationId": "org_01J1Y2A3B4C5D6E7F8G9H0J1K2", "organizationName": "Cabinet Benali Conseil", "role": "owner", "default": false }
  ],
  "createdAt": "2025-11-04T09:12:44Z"
}
```

**`GET /users/me/sessions`** — response:

```json
{
  "data": [
    {
      "id": "ses_01J1XE0A1B2C3D4E5F6G7H8J9K",
      "current": true,
      "deviceName": "MacBook Pro — Direction Juridique",
      "ip": "41.111.212.14",
      "location": "Alger, DZ",
      "userAgent": "Mozilla/5.0 (Macintosh; ...)",
      "createdAt": "2026-07-01T08:03:11Z",
      "lastSeenAt": "2026-07-02T14:29:52Z"
    },
    {
      "id": "ses_01J1WV9Z8Y7X6W5V4U3T2S1R0Q",
      "current": false,
      "deviceName": "iPhone 15 — CertiDZ Mobile",
      "ip": "105.98.44.201",
      "location": "Oran, DZ",
      "createdAt": "2026-06-27T18:44:02Z",
      "lastSeenAt": "2026-07-02T07:15:20Z"
    }
  ],
  "pagination": { "nextCursor": null, "hasMore": false, "limit": 25 }
}
```

### 3.3 Organizations

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| GET | `/organizations` | user | Organizations of the current user |
| POST | `/organizations` | user | Create organization (caller becomes `owner`) |
| GET | `/organizations/{id}` | user (member) | Organization detail |
| PATCH | `/organizations/{id}` | admin | Update name, branding, legal info, settings |
| DELETE | `/organizations/{id}` | owner (fresh auth) | Soft-delete; 30-day recovery window |
| GET | `/organizations/{id}/members` | user (member) | List members with roles |
| PATCH | `/organizations/{id}/members/{userId}` | admin | Change member role |
| DELETE | `/organizations/{id}/members/{userId}` | admin | Remove member |
| GET | `/organizations/{id}/invitations` | admin | List pending invitations |
| POST | `/organizations/{id}/invitations` | admin | Invite by email with role |
| DELETE | `/organizations/{id}/invitations/{invId}` | admin | Revoke invitation |
| POST | `/organizations/invitations/accept` | user | Accept invitation with token |
| GET | `/organizations/{id}/roles` | user (member) | Role catalog (built-in + custom, Enterprise) |
| POST | `/organizations/{id}/roles` | owner | Create custom role (Enterprise plan) |

Built-in roles: `owner` > `admin` > `manager` (envelopes/documents/workflows) > `member` (own resources) > `viewer` (read-only) > `auditor` (audit + verification read-only).

**`POST /organizations/{id}/invitations`** — request / response `201`:

```json
{
  "email": "yacine.hamdi@sonelgaz.dz",
  "role": "manager",
  "message": "Bienvenue dans l'espace signature de la Direction Juridique."
}
```
```json
{
  "id": "inv_01J1XE7K8L9M0N1P2Q3R4S5T6U",
  "email": "yacine.hamdi@sonelgaz.dz",
  "role": "manager",
  "status": "pending",
  "invitedBy": "usr_01J1X9A8B7C6D5E4F3G2H1J0K9",
  "expiresAt": "2026-07-09T14:31:07Z",
  "createdAt": "2026-07-02T14:31:07Z"
}
```

**`GET /organizations/org_01J1X8Z7.../`** — response:

```json
{
  "id": "org_01J1X8Z7Y6X5W4V3U2T1S0R9Q8",
  "name": "Sonelgaz",
  "legalName": "Société Nationale de l'Électricité et du Gaz SPA",
  "country": "DZ",
  "taxId": "099918000123456",
  "rcNumber": "16/00-0012345B99",
  "plan": "enterprise",
  "status": "active",
  "branding": {
    "logoUrl": "https://cdn.certidz.dz/org/sonelgaz/logo.png",
    "primaryColor": "#00529B",
    "emailFooter": "Sonelgaz — Direction Juridique — Alger"
  },
  "settings": {
    "defaultLocale": "fr",
    "signatureLevelDefault": "advanced",
    "envelopeExpiryDays": 30,
    "requireMfaForMembers": true,
    "allowedSignerAuthMethods": ["email_otp", "sms_otp", "identity_verification"],
    "dataResidency": "dz"
  },
  "memberCount": 148,
  "createdAt": "2025-09-15T10:00:00Z"
}
```

### 3.4 Documents

Upload uses a **3-step presigned flow** — binary bytes never transit the API tier:

```
1. POST /documents                    → { document(draft), upload:{url, headers, expiresAt} }
2. PUT  {upload.url}                  → client uploads bytes directly to object storage
3. POST /documents/{id}/finalize      → server verifies size + SHA-256, runs AV scan, status=available
```

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/documents` | user / `key:documents:write` | Create draft + presigned PUT URL |
| POST | `/documents/{id}/finalize` | user / `key:documents:write` | Confirm upload; integrity + antivirus check |
| GET | `/documents` | user / `key:documents:read` | List (filters: `status`, `contentType`, `folderId`, `q`, `createdAfter/Before`, `tag`) |
| GET | `/documents/{id}` | user / `key:documents:read` | Metadata (`?expand=versions,envelopes`) |
| GET | `/documents/{id}/download` | user / `key:documents:read` | 302 → time-limited presigned GET (5 min) |
| GET | `/documents/{id}/versions` | user | Version history |
| POST | `/documents/{id}/versions` | user | New version (same presigned flow) |
| DELETE | `/documents/{id}` | user (owner of doc) / admin | Soft delete; blocked (`409`) if referenced by an in-flight envelope |
| GET | `/documents/search` | user | Full-text + AI semantic search (`?q=&mode=keyword|semantic|hybrid`) |

**`POST /documents`** — request:

```json
{
  "fileName": "Contrat-Fourniture-Electricite-2026.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 2481394,
  "sha256": "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c",
  "folderId": "fld_01J1XEB2C3D4E5F6G7H8J9K0L1",
  "tags": ["contrat", "fourniture", "2026"]
}
```

Response `201`:

```json
{
  "document": {
    "id": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8",
    "fileName": "Contrat-Fourniture-Electricite-2026.pdf",
    "contentType": "application/pdf",
    "sizeBytes": 2481394,
    "sha256": "b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c",
    "status": "awaiting_upload",
    "version": 1,
    "tags": ["contrat", "fourniture", "2026"],
    "createdBy": "usr_01J1X9A8B7C6D5E4F3G2H1J0K9",
    "createdAt": "2026-07-02T14:32:10Z"
  },
  "upload": {
    "method": "PUT",
    "url": "https://storage.certidz.dz/tenants/org_01J1X8Z7/staging/doc_01J1XEC9...?X-Amz-Signature=...",
    "headers": { "Content-Type": "application/pdf", "x-amz-checksum-sha256": "tbudgBSg+bHWHiHnlteNzN8TUvI80ygS9IULh4rklEw=" },
    "expiresAt": "2026-07-02T15:02:10Z"
  }
}
```

**`POST /documents/{id}/finalize`** — empty body. Response `200` with `status: "available"`, `pageCount: 14`. Failure modes: `409 CONFLICT` (bytes not uploaded / size mismatch), `422 VALIDATION_FAILED` with `details.issue: "SHA256_MISMATCH"`, or `422` `details.issue: "MALWARE_DETECTED"` (document quarantined, `document.quarantined` webhook fired).

Accepted formats: PDF (native + PDF/A), DOCX/XLSX/PPTX (auto-converted to PDF/A-2b for signing), PNG/JPEG (wrapped). Max size: 25 MB (Free/Starter), 100 MB (Business), 500 MB (Enterprise).

### 3.5 Envelopes

The envelope is the signing transaction: documents + signers + fields + routing + policy.

State machine: `draft → sent → delivered → (partially_signed) → completed | declined | voided | expired`.

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/envelopes` | user / `key:envelopes:write` | Create draft envelope |
| GET | `/envelopes` | user / `key:envelopes:read` | List (filters: `status`, `signerEmail`, `createdAfter/Before`, `templateId`, `q`) |
| GET | `/envelopes/{id}` | user / `key:envelopes:read` | Detail (`?expand=signers,documents,fields,auditSummary`) |
| PATCH | `/envelopes/{id}` | user (creator/manager) | Update draft only (`409` otherwise) |
| POST | `/envelopes/{id}/send` | user / `key:envelopes:write` | Validate + dispatch to routing order 1 |
| POST | `/envelopes/{id}/remind` | user / `key:envelopes:write` | Manual reminder to pending signers (max 1/24 h/signer) |
| POST | `/envelopes/{id}/void` | user (creator) / admin | Void with mandatory `reason`; notifies signers |
| GET | `/envelopes/{id}/certificate-of-completion` | user / `key:envelopes:read` | Signed PDF audit certificate |
| POST | `/envelopes/{id}/signers/{sid}/signing-session` | user / `key:envelopes:write` | Mint signer ceremony token + URL (embedded signing) |
| POST | `/envelopes/{id}/signers/{sid}/decline` | signer-session | Signer declines with reason |
| GET | `/envelopes/{id}/signers/{sid}` | user, signer-session | Signer status detail |

**`POST /envelopes`** — full realistic request:

```json
{
  "title": "Contrat de fourniture d'électricité HT — Cevital Béjaïa",
  "message": "Merci de signer avant le 15 juillet. Direction Commerciale Sonelgaz.",
  "documents": [
    { "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "order": 1 }
  ],
  "signatureLevel": "advanced",
  "signers": [
    {
      "email": "amina.benali@sonelgaz.dz",
      "fullName": "Amina Benali",
      "role": "Directrice Juridique — Sonelgaz",
      "routingOrder": 1,
      "authMethods": ["email_otp"],
      "locale": "fr",
      "fields": [
        { "type": "signature", "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "page": 14, "x": 92, "y": 640, "width": 180, "height": 60, "required": true },
        { "type": "date_signed", "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "page": 14, "x": 92, "y": 710, "width": 120, "height": 24 }
      ]
    },
    {
      "email": "karim.meziane@cevital.dz",
      "fullName": "Karim Meziane",
      "role": "Directeur Général Adjoint — Cevital",
      "routingOrder": 2,
      "authMethods": ["sms_otp", "identity_verification"],
      "phone": "+213770987654",
      "locale": "fr",
      "fields": [
        { "type": "signature", "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "page": 14, "x": 340, "y": 640, "width": 180, "height": 60, "required": true },
        { "type": "initials", "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "page": 7, "x": 500, "y": 780, "width": 60, "height": 30 },
        { "type": "text", "name": "fonction", "label": "Fonction", "page": 14, "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "x": 340, "y": 710, "width": 180, "height": 24, "required": true }
      ]
    }
  ],
  "carbonCopies": [
    { "email": "archives@sonelgaz.dz", "fullName": "Service Archives" }
  ],
  "expiresAt": "2026-07-15T23:59:59Z",
  "reminders": { "enabled": true, "firstAfterDays": 2, "repeatEveryDays": 3 },
  "metadata": { "crmRef": "OPP-2026-04471", "wilaya": "Béjaïa" }
}
```

Response `201` (abridged — same shape as GET below with `status: "draft"`).

**`GET /envelopes/env_01J1XF2G.../?expand=signers`** — response:

```json
{
  "id": "env_01J1XF2G3H4J5K6L7M8N9P0Q1R",
  "title": "Contrat de fourniture d'électricité HT — Cevital Béjaïa",
  "status": "sent",
  "version": 3,
  "signatureLevel": "advanced",
  "documents": [
    { "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "fileName": "Contrat-Fourniture-Electricite-2026.pdf", "order": 1, "pageCount": 14 }
  ],
  "signers": [
    {
      "id": "sgn_01J1XF3A4B5C6D7E8F9G0H1J2K",
      "email": "amina.benali@sonelgaz.dz",
      "fullName": "Amina Benali",
      "routingOrder": 1,
      "status": "signed",
      "authMethods": ["email_otp"],
      "signedAt": "2026-07-02T15:47:12Z",
      "ip": "41.111.212.14",
      "signatureId": "sig_01J1XG8Z9Y0X1W2V3U4T5S6R7Q"
    },
    {
      "id": "sgn_01J1XF3B5C6D7E8F9G0H1J2K3L",
      "email": "karim.meziane@cevital.dz",
      "fullName": "Karim Meziane",
      "routingOrder": 2,
      "status": "delivered",
      "authMethods": ["sms_otp", "identity_verification"],
      "lastViewedAt": "2026-07-02T16:02:33Z"
    }
  ],
  "routing": { "mode": "sequential", "currentOrder": 2 },
  "expiresAt": "2026-07-15T23:59:59Z",
  "metadata": { "crmRef": "OPP-2026-04471", "wilaya": "Béjaïa" },
  "createdBy": "usr_01J1X9A8B7C6D5E4F3G2H1J0K9",
  "sentAt": "2026-07-02T14:40:05Z",
  "createdAt": "2026-07-02T14:35:41Z",
  "updatedAt": "2026-07-02T16:02:33Z"
}
```

**`POST /envelopes/{id}/signers/{sid}/signing-session`** — embedded-signing token for your own UI:

```json
{ "returnUrl": "https://portail.cevital.dz/signature/retour", "expiresInMinutes": 60 }
```
```json
{
  "sessionToken": "eyJhbGciOiJFUzI1NiIs...scope=signing-session...",
  "signingUrl": "https://sign.certidz.dz/s/env_01J1XF2G3H4J5K6L7M8N9P0Q1R?t=eyJhbGciOiJ...",
  "expiresAt": "2026-07-02T17:05:00Z"
}
```

**`POST /envelopes/{id}/void`** — `{ "reason": "Conditions tarifaires renégociées — nouvelle version à venir." }` → `200`, `status: "voided"`; pending signing sessions are invalidated instantly; `envelope.voided` webhook fires.

### 3.6 Signatures

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/envelopes/{id}/signers/{sid}/sign` | signer-session | Apply signature (after auth challenges + consent) |
| GET | `/signatures/{id}` | user / `key:envelopes:read` | Cryptographic detail of one applied signature |
| GET | `/envelopes/{id}/signatures` | user / `key:envelopes:read` | All signatures on an envelope |

**`POST /envelopes/{id}/signers/{sid}/sign`** — request (ceremony backend call after OTP verified & consent captured):

```json
{
  "consent": {
    "agreedToElectronicSignature": true,
    "consentTextVersion": "fr-2026-02",
    "timestamp": "2026-07-02T16:41:02Z"
  },
  "authEvidence": [
    { "method": "sms_otp", "verifiedAt": "2026-07-02T16:39:48Z", "phoneLast4": "7654" },
    { "method": "identity_verification", "verificationId": "idv_01J1XGH0J1K2L3M4N5P6Q7R8S9" }
  ],
  "fieldValues": [
    { "fieldName": "fonction", "value": "Directeur Général Adjoint" }
  ],
  "appearance": { "type": "drawn", "imageId": "sigimg_01J1XGJ2K3L4M5N6P7Q8R9S0T1" }
}
```

Response `201`:

```json
{
  "id": "sig_01J1XGK4L5M6N7P8Q9R0S1T2U3",
  "envelopeId": "env_01J1XF2G3H4J5K6L7M8N9P0Q1R",
  "signerId": "sgn_01J1XF3B5C6D7E8F9G0H1J2K3L",
  "format": "PAdES-B-LTA",
  "signatureLevel": "advanced",
  "digestAlgorithm": "SHA-256",
  "signedHash": "9c8e1f0a4b3d2e1f...c0ffee",
  "certificate": {
    "id": "cert_01J1XGM6N7P8Q9R0S1T2U3V4W5",
    "subject": "CN=Karim Meziane, O=Cevital SPA, C=DZ",
    "issuer": "CN=CertiDZ Issuing CA 2, O=HISN Trust Services, C=DZ",
    "serialNumber": "4F:A2:19:8C:33:D1:07:BB",
    "notBefore": "2026-07-02T16:41:00Z",
    "notAfter": "2026-07-02T17:41:00Z",
    "keyAlgorithm": "EC P-256",
    "type": "short_lived_signing"
  },
  "timestamp": {
    "tsa": "https://tsa.certidz.dz",
    "time": "2026-07-02T16:41:05Z",
    "serialNumber": "0x1A2B3C4D",
    "hashAlgorithm": "SHA-256",
    "status": "valid"
  },
  "ltv": { "enabled": true, "ocspResponsesEmbedded": 2, "crlsEmbedded": 1 },
  "signedAt": "2026-07-02T16:41:05Z"
}
```

If this was the last pending signer, the envelope transitions to `completed`, the final sealed PDF and the certificate of completion are generated, and `envelope.completed` + `signature.applied` webhooks fire.

### 3.7 Verification

Public trust verification — the flagship "verify anything" endpoint.

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/verify/document` | public (rate-limited by IP) / `key:verify:read` | Upload a signed PDF (multipart) **or** send `{ "sha256": "..." }` for CertiDZ-issued docs |
| GET | `/verify/reports/{id}` | public (report token) | Retrieve a previously generated report |
| GET | `/verify/qr/{code}` | public | Resolve the QR short-code printed on sealed PDFs |

**`POST /verify/document`** — by hash:

```json
{ "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
```

Response `200` — full validity report:

```json
{
  "reportId": "vrf_01J1XGT8U9V0W1X2Y3Z4A5B6C7",
  "verifiedAt": "2026-07-02T17:10:44Z",
  "overallResult": "TOTAL_PASSED",
  "document": {
    "fileName": "Contrat-Fourniture-Electricite-2026-signed.pdf",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "integrity": "INTACT",
    "modifiedAfterSigning": false
  },
  "signatures": [
    {
      "signerName": "Karim Meziane",
      "format": "PAdES-B-LTA",
      "result": "PASSED",
      "checks": {
        "integrity": { "status": "PASSED", "detail": "Le condensat signé correspond au document." },
        "certificateChain": {
          "status": "PASSED",
          "chain": [
            "CN=Karim Meziane, O=Cevital SPA, C=DZ",
            "CN=CertiDZ Issuing CA 2, O=HISN Trust Services, C=DZ",
            "CN=CertiDZ Root CA, O=HISN Trust Services, C=DZ"
          ],
          "trustAnchor": "CertiDZ Root CA (ARPCE trusted list)"
        },
        "revocation": { "status": "PASSED", "method": "OCSP", "checkedAt": "2026-07-02T17:10:44Z" },
        "timestamp": { "status": "PASSED", "tsa": "https://tsa.certidz.dz", "time": "2026-07-02T16:41:05Z" },
        "ltv": { "status": "PASSED", "detail": "Matériel de validation embarqué (OCSP + CRL + chaîne)." }
      },
      "signedAt": "2026-07-02T16:41:05Z",
      "signatureLevelClaimed": "advanced",
      "legalFramework": ["Loi 15-04 (DZ) — signature électronique avancée", "eIDAS AdES-equivalent"]
    }
  ],
  "publicReportUrl": "https://verify.certidz.dz/r/vrf_01J1XGT8U9V0W1X2Y3Z4A5B6C7"
}
```

`overallResult` closed enum: `TOTAL_PASSED` | `INDETERMINATE` | `TOTAL_FAILED` (ETSI EN 319 102-1 semantics). A tampered document returns `200` with `overallResult: "TOTAL_FAILED"` and `document.integrity: "TAMPERED"` — verification *executes*; only malformed input yields `4xx` (`422 SIGNATURE_INVALID` is reserved for signing-time failures, not verification reports).

### 3.8 Certificates

PKI & certificate lifecycle (CertiDZ CA hierarchy + BYO-CSR).

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/certificates/requests` | admin / `key:certificates:write` | Submit request (generated key on HSM, or attach PKCS#10 CSR) |
| GET | `/certificates/requests/{id}` | admin | Request status (`pending_validation → approved → issued` / `rejected`) |
| POST | `/certificates/requests/{id}/approve` | RA operator (CertiDZ internal / Enterprise RA delegate) | Approve after identity vetting |
| GET | `/certificates` | user / `key:certificates:read` | List org certificates (filters: `status`, `type`, `expiresBefore`) |
| GET | `/certificates/{id}` | user / `key:certificates:read` | Detail incl. chain refs, OCSP/CRL URLs |
| GET | `/certificates/{id}/download?format=pem\|der\|p7b` | user | Certificate + chain bundle |
| POST | `/certificates/{id}/revoke` | admin (fresh auth) | Revoke with RFC 5280 reason code |
| GET | `/certificates/ca/chain` | public | Current CA chain (PEM) |

**`POST /certificates/requests`** — with CSR:

```json
{
  "type": "advanced_signing",
  "profile": "person",
  "subject": {
    "commonName": "Amina Benali",
    "organization": "Sonelgaz",
    "country": "DZ",
    "email": "amina.benali@sonelgaz.dz",
    "nationalId": "109954321098765432"
  },
  "csr": "-----BEGIN CERTIFICATE REQUEST-----\nMIICijCCAXICAQAwRTELMAkGA1UEBhMCRFo...\n-----END CERTIFICATE REQUEST-----",
  "validityDays": 730,
  "identityVerificationId": "idv_01J1XGH0J1K2L3M4N5P6Q7R8S9"
}
```

Response `201`: `{ "id": "creq_01J1XH2A...", "status": "pending_validation", "requiredEvidence": ["identity_verification"], "estimatedIssuance": "P1D" }`.

**`GET /certificates/cert_01J1XGM6.../`** — response:

```json
{
  "id": "cert_01J1XGM6N7P8Q9R0S1T2U3V4W5",
  "type": "advanced_signing",
  "status": "active",
  "subject": "CN=Amina Benali, O=Sonelgaz, C=DZ",
  "issuer": "CN=CertiDZ Issuing CA 2, O=HISN Trust Services, C=DZ",
  "serialNumber": "6B:E1:44:0A:97:2C:51:8D",
  "keyAlgorithm": "EC P-256",
  "keyStorage": "hsm",
  "notBefore": "2026-07-03T09:00:00Z",
  "notAfter": "2028-07-03T09:00:00Z",
  "ocspUrl": "https://ocsp.certidz.dz",
  "crlUrl": "https://crl.certidz.dz/issuing-ca-2.crl",
  "fingerprintSha256": "AA:1F:...:9E",
  "usage": { "signaturesApplied": 214, "lastUsedAt": "2026-07-02T16:41:05Z" }
}
```

**`POST /certificates/{id}/revoke`** — reason codes (RFC 5280): `key_compromise`, `affiliation_changed`, `superseded`, `cessation_of_operation`, `privilege_withdrawn`, `unspecified`.

```json
{ "reason": "key_compromise", "comment": "Poste de travail compromis — incident SOC-2026-0173." }
```

Response `200`: `{ "status": "revoked", "revokedAt": "2026-07-02T17:20:00Z", "reason": "key_compromise", "crlPublicationEta": "PT15M" }`. Revocation is **irreversible**; OCSP reflects it within 60 s, CRL within 15 min. Fires `certificate.revoked` webhook.

### 3.9 Identity Verification

KYC pipeline: ID document OCR → face match → liveness → optional NFC chip read (biometric passports / new CNIe).

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/identity/verifications` | user / `key:identity:write` | Create verification session |
| POST | `/identity/verifications/{id}/documents` | session token | Upload ID images (multipart: `front`, `back`) |
| POST | `/identity/verifications/{id}/liveness/session` | session token | Start liveness challenge (returns SDK token) |
| POST | `/identity/verifications/{id}/nfc` | session token | Submit NFC chip read result (DG1/DG2 + SOD) |
| POST | `/identity/verifications/{id}/submit` | session token | Trigger adjudication |
| GET | `/identity/verifications/{id}` | user / `key:identity:read` | Result with scores |
| GET | `/identity/verifications` | user / `key:identity:read` | List (filters: `status`, `subjectEmail`, `createdAfter`) |

**`POST /identity/verifications`** — request:

```json
{
  "subject": { "fullName": "Karim Meziane", "email": "karim.meziane@cevital.dz", "phone": "+213770987654" },
  "requiredChecks": ["document_authenticity", "face_match", "liveness"],
  "optionalChecks": ["nfc_chip"],
  "acceptedDocuments": ["dz_cnie", "dz_passport", "dz_driving_license"],
  "redirectUrl": "https://portail.cevital.dz/kyc/retour",
  "expiresInHours": 48
}
```

Response `201`: `{ "id": "idv_01J1XGH0J1K2L3M4N5P6Q7R8S9", "status": "awaiting_input", "sessionUrl": "https://id.certidz.dz/v/idv_01J1XGH0...?t=...", "sessionToken": "eyJ...", "expiresAt": "2026-07-04T14:00:00Z" }`.

**`GET /identity/verifications/{id}`** — completed result:

```json
{
  "id": "idv_01J1XGH0J1K2L3M4N5P6Q7R8S9",
  "status": "verified",
  "subject": { "fullName": "Karim Meziane", "email": "karim.meziane@cevital.dz" },
  "document": {
    "type": "dz_cnie",
    "country": "DZ",
    "documentNumber": "40012345678",
    "nin": "109871234567890123",
    "surname": "MEZIANE",
    "givenNames": "KARIM",
    "dateOfBirth": "1987-03-14",
    "expiryDate": "2031-05-20",
    "mrzValid": true
  },
  "checks": {
    "document_authenticity": { "result": "pass", "score": 0.97, "signals": ["hologram_detected", "font_consistency", "mrz_checksum_valid"] },
    "face_match": { "result": "pass", "score": 0.94, "threshold": 0.85 },
    "liveness": { "result": "pass", "score": 0.99, "method": "active_3d", "attempts": 1 },
    "nfc_chip": { "result": "pass", "sodSignatureValid": true, "issuingCountrySigner": "C=DZ, O=Ministère de l'Intérieur", "dg2FaceMatchScore": 0.96 }
  },
  "riskFlags": [],
  "completedAt": "2026-07-02T16:20:11Z",
  "evidenceRetentionUntil": "2031-07-02T16:20:11Z"
}
```

`status` enum: `awaiting_input` → `processing` → `verified` | `rejected` | `expired` | `requires_manual_review`. Rejection includes `rejectionReasons[]` (e.g. `DOCUMENT_EXPIRED`, `FACE_MISMATCH`, `LIVENESS_FAILED`, `SUSPECTED_TAMPERING`). Fires `identity.verified` / `identity.rejected`.

### 3.10 Workflows

Declarative multi-step automation (approve → sign → archive → notify).

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/workflows` | manager+ | Create workflow definition |
| GET | `/workflows` | user | List definitions |
| GET | `/workflows/{id}` | user | Definition detail |
| PATCH | `/workflows/{id}` | manager+ | Update (creates new `definitionVersion`) |
| DELETE | `/workflows/{id}` | admin | Archive definition (running instances finish) |
| POST | `/workflows/{id}/runs` | user / `key:envelopes:write` | Trigger a run with input payload |
| GET | `/workflows/{id}/runs` | user | List runs (filters: `status`, `startedAfter`) |
| GET | `/workflows/runs/{runId}` | user | Run detail with step states |
| POST | `/workflows/runs/{runId}/steps/{stepId}/approve` | assigned approver | Approve pending step |
| POST | `/workflows/runs/{runId}/steps/{stepId}/reject` | assigned approver | Reject with reason (run → `failed` or branch) |
| POST | `/workflows/runs/{runId}/cancel` | run initiator / admin | Cancel run |

**`POST /workflows`** — request (abridged definition):

```json
{
  "name": "Validation contrats > 10M DZD",
  "trigger": { "type": "manual" },
  "steps": [
    { "id": "review-legal", "type": "approval", "name": "Revue juridique", "assignees": { "role": "legal_reviewer" }, "slaHours": 48 },
    { "id": "ai-risk", "type": "ai_review", "name": "Analyse IA des risques", "config": { "action": "review-contract", "blockOnRiskAbove": "high" } },
    { "id": "sign", "type": "envelope", "name": "Signature DG", "config": { "templateId": "tpl_01J1XHM2N3P4Q5R6S7T8U9V0W1" }, "dependsOn": ["review-legal", "ai-risk"] },
    { "id": "archive", "type": "archive", "name": "Archivage légal 10 ans", "dependsOn": ["sign"], "config": { "retentionYears": 10 } }
  ]
}
```

**`GET /workflows/runs/{runId}`** — response:

```json
{
  "id": "wfr_01J1XHR4S5T6U7V8W9X0Y1Z2A3",
  "workflowId": "wf_01J1XHP0Q1R2S3T4U5V6W7X8Y9",
  "definitionVersion": 4,
  "status": "running",
  "input": { "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "amountDzd": 48000000 },
  "steps": [
    { "id": "review-legal", "status": "completed", "outcome": "approved", "actedBy": "usr_01J1X9A8B7C6D5E4F3G2H1J0K9", "comment": "Clause pénalités OK après amendement.", "completedAt": "2026-07-02T11:05:00Z" },
    { "id": "ai-risk", "status": "completed", "outcome": "passed", "output": { "riskLevel": "medium", "reportId": "airev_01J1XHT6..." }, "completedAt": "2026-07-02T09:14:30Z" },
    { "id": "sign", "status": "in_progress", "envelopeId": "env_01J1XF2G3H4J5K6L7M8N9P0Q1R", "startedAt": "2026-07-02T11:05:02Z" },
    { "id": "archive", "status": "pending" }
  ],
  "startedAt": "2026-07-02T09:12:00Z"
}
```

### 3.11 AI Document Intelligence

All AI endpoints consume plan **AI tokens** (`usage` block returned on every call). Long-running responses stream via **SSE** when `Accept: text/event-stream` is sent; otherwise the API blocks until completion (max 120 s) or returns `202` + poll URL for batch jobs.

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/ai/documents/{id}/chat` | user / `key:ai:invoke` | Conversational Q&A grounded on the document (RAG) |
| POST | `/ai/documents/{id}/summarize` | user / `key:ai:invoke` | Structured summary (length/style options) |
| POST | `/ai/documents/{id}/extract-entities` | user / `key:ai:invoke` | Extract typed entities (parties, dates, amounts, obligations) |
| POST | `/ai/documents/{id}/review-contract` | user / `key:ai:invoke` | Clause-level risk review vs. playbook |
| POST | `/ai/documents/compare` | user / `key:ai:invoke` | Semantic diff of two documents/versions |
| POST | `/ai/documents/{id}/translate` | user / `key:ai:invoke` | Layout-preserving translation (fr/ar/en) → new document version |
| GET | `/ai/jobs/{jobId}` | user | Poll batch job status/result |

**`POST /ai/documents/{id}/chat`** — request:

```json
{
  "conversationId": "aichat_01J1XJ0B1C2D3E4F5G6H7J8K9L",
  "message": "Quelles sont les pénalités de retard prévues et sont-elles plafonnées ?",
  "locale": "fr"
}
```

SSE stream:

```
event: message.delta
data: {"delta":"L'article 12.3 prévoit des pénalités de retard de 0,5 % du montant"}

event: message.delta
data: {"delta":" mensuel par semaine de retard, plafonnées à 7 % du montant annuel du contrat."}

event: citations
data: {"citations":[{"page":9,"quote":"les pénalités ne sauraient excéder sept pour cent (7%)","bbox":[71,402,489,431]}]}

event: message.completed
data: {"messageId":"aimsg_01J1XJ1C2D3E4F5G6H7J8K9L0M","usage":{"inputTokens":6412,"outputTokens":118}}
```

**`POST /ai/documents/{id}/extract-entities`** — response `200`:

```json
{
  "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8",
  "entities": {
    "parties": [
      { "name": "Sonelgaz SPA", "role": "fournisseur", "confidence": 0.99, "page": 1 },
      { "name": "Cevital SPA", "role": "client", "confidence": 0.99, "page": 1 }
    ],
    "amounts": [
      { "label": "Montant annuel estimé", "amount": 4800000000, "currency": "DZD", "page": 4, "confidence": 0.97 }
    ],
    "dates": [
      { "label": "Date d'effet", "value": "2026-09-01", "page": 2 },
      { "label": "Échéance", "value": "2029-08-31", "page": 2 }
    ],
    "obligations": [
      { "party": "Sonelgaz SPA", "text": "Garantir une disponibilité réseau de 99,5 % hors force majeure.", "page": 6, "riskTag": "sla" }
    ]
  },
  "usage": { "inputTokens": 18240, "outputTokens": 642, "monthlyRemaining": 2714506 }
}
```

### 3.12 Webhooks

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/webhooks` | admin / `key:webhooks:manage` | Create endpoint subscription |
| GET | `/webhooks` | admin | List endpoints |
| GET | `/webhooks/{id}` | admin | Endpoint detail + health |
| PATCH | `/webhooks/{id}` | admin | Update URL/events/status |
| DELETE | `/webhooks/{id}` | admin | Delete endpoint |
| POST | `/webhooks/{id}/rotate-secret` | admin | Rotate secret (dual-signature grace, §5.4) |
| POST | `/webhooks/{id}/test` | admin | Send a `ping` test delivery |
| GET | `/webhooks/{id}/deliveries` | admin | Delivery log (filters: `status`, `eventType`) |
| POST | `/webhooks/{id}/deliveries/{dlvId}/retry` | admin | Manual redelivery |

**`POST /webhooks`** — request / response `201`:

```json
{
  "url": "https://erp.sonelgaz.dz/hooks/certidz",
  "events": ["envelope.completed", "envelope.declined", "certificate.expiring", "identity.verified"],
  "description": "Intégration ERP — Direction Juridique",
  "apiVersion": "v1"
}
```
```json
{
  "id": "whk_01J1XJD4E5F6G7H8J9K0L1M2N3",
  "url": "https://erp.sonelgaz.dz/hooks/certidz",
  "events": ["envelope.completed", "envelope.declined", "certificate.expiring", "identity.verified"],
  "status": "active",
  "secret": "whsec_Zk9qP3rT8vW2xY5aB7cD1eF4gH6jK0mN",
  "health": { "last24h": { "delivered": 0, "failed": 0 }, "consecutiveFailures": 0 },
  "createdAt": "2026-07-02T17:30:00Z"
}
```

`secret` is returned **only at creation and rotation**. Endpoint URLs must be HTTPS with a valid public certificate; private-range IPs are rejected (`VALIDATION_FAILED`, SSRF guard).

### 3.13 Audit Trail

Append-only, hash-chained event ledger per organization (each event embeds `prevHash`; daily anchors are timestamped by the TSA).

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| GET | `/audit/events` | admin, auditor / `key:audit:read` | Query events (filters: `actorId`, `action`, `resourceType`, `resourceId`, `ip`, `occurredAfter/Before`) |
| GET | `/audit/events/{id}` | admin, auditor | Single event |
| POST | `/audit/exports` | admin, auditor | Async export (CSV/JSONL/PDF) → signed download |
| GET | `/audit/exports/{id}` | admin, auditor | Export status + URL |
| GET | `/audit/verify` | admin, auditor | Verify hash-chain integrity over a range |

**`GET /audit/events?resourceId=env_01J1XF2G...&limit=2`** — response:

```json
{
  "data": [
    {
      "id": "aud_01J1XJH6J7K8L9M0N1P2Q3R4S5",
      "action": "envelope.signer.signed",
      "actor": { "type": "signer", "id": "sgn_01J1XF3B5C6D7E8F9G0H1J2K3L", "email": "karim.meziane@cevital.dz" },
      "resource": { "type": "envelope", "id": "env_01J1XF2G3H4J5K6L7M8N9P0Q1R" },
      "context": { "ip": "154.121.30.88", "userAgent": "Mozilla/5.0 (iPhone; ...)", "geo": "Béjaïa, DZ", "authMethods": ["sms_otp", "identity_verification"] },
      "hash": "sha256:aa31c09f...",
      "prevHash": "sha256:77b2e441...",
      "occurredAt": "2026-07-02T16:41:05Z"
    },
    {
      "id": "aud_01J1XJG5H6J7K8L9M0N1P2Q3R4",
      "action": "envelope.viewed",
      "actor": { "type": "signer", "id": "sgn_01J1XF3B5C6D7E8F9G0H1J2K3L" },
      "resource": { "type": "envelope", "id": "env_01J1XF2G3H4J5K6L7M8N9P0Q1R" },
      "context": { "ip": "154.121.30.88" },
      "hash": "sha256:77b2e441...",
      "prevHash": "sha256:1c9de002...",
      "occurredAt": "2026-07-02T16:02:33Z"
    }
  ],
  "pagination": { "nextCursor": "eyJpZCI6ImF1ZF8wMUoxWEpHNS4uLiJ9", "hasMore": true, "limit": 2 }
}
```

**`GET /audit/verify?from=2026-06-01T00:00:00Z&to=2026-07-01T00:00:00Z`** — response:

```json
{
  "range": { "from": "2026-06-01T00:00:00Z", "to": "2026-07-01T00:00:00Z" },
  "eventsChecked": 48211,
  "chainValid": true,
  "anchors": [
    { "date": "2026-06-30", "rootHash": "sha256:f00dbabe...", "tsaTimestampSerial": "0x9F31A2", "status": "valid" }
  ],
  "verifiedAt": "2026-07-02T17:41:00Z"
}
```

### 3.14 API Keys

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| POST | `/api-keys` | admin (fresh auth) | Create scoped key (plaintext shown once) |
| GET | `/api-keys` | admin | List (prefix + last4 only) |
| PATCH | `/api-keys/{id}` | admin | Update name, scopes, IP allowlist |
| POST | `/api-keys/{id}/roll` | admin | Create replacement; old key valid for `graceHours` |
| DELETE | `/api-keys/{id}` | admin | Revoke immediately |

**`POST /api-keys`** — request / response `201`:

```json
{
  "name": "ERP Production — Sonelgaz",
  "environment": "live",
  "scopes": ["envelopes:read", "envelopes:write", "documents:write", "webhooks:manage"],
  "ipAllowlist": ["41.111.212.0/24"],
  "expiresAt": "2027-07-02T00:00:00Z"
}
```
```json
{
  "id": "key_01J1XJP8Q9R0S1T2U3V4W5X6Y7",
  "name": "ERP Production — Sonelgaz",
  "key": "cdz_live_sk_9f2aX7bK3mQ8pL1wN6vR4tZ0yH5cJ2eD8gF7hA1s",
  "keyPrefix": "cdz_live_sk_9f2a",
  "last4": "hA1s",
  "scopes": ["envelopes:read", "envelopes:write", "documents:write", "webhooks:manage"],
  "ipAllowlist": ["41.111.212.0/24"],
  "expiresAt": "2027-07-02T00:00:00Z",
  "createdAt": "2026-07-02T17:45:00Z"
}
```

### 3.15 Billing

| Method | Path | Auth/Permission | Description |
|---|---|---|---|
| GET | `/billing/subscription` | admin / `key:billing:read` | Current plan, period, seats |
| POST | `/billing/subscription/change` | owner | Upgrade/downgrade (proration preview with `?dryRun=true`) |
| GET | `/billing/invoices` | admin | Invoice list |
| GET | `/billing/invoices/{id}/pdf` | admin | Invoice PDF (Algerian fiscal format, NIF/RC/AI) |
| GET | `/billing/usage` | admin / `key:billing:read` | Live usage vs. quotas |
| GET | `/billing/payment-methods` | owner | List (CIB/EDAHABIA via SATIM, card, bank transfer) |

**`GET /billing/usage`** — response:

```json
{
  "period": { "start": "2026-07-01T00:00:00Z", "end": "2026-08-01T00:00:00Z" },
  "plan": "business",
  "metrics": {
    "envelopes": { "used": 214, "limit": 1000 },
    "aiTokens": { "used": 285494, "limit": 3000000 },
    "identityVerifications": { "used": 37, "limit": 500 },
    "storageBytes": { "used": 18734211072, "limit": 107374182400 },
    "apiRequests24h": 41205
  },
  "overageAllowed": true,
  "overageRates": { "envelope": { "amount": 45000, "currency": "DZD", "per": 100 } }
}
```

---

## 4. GraphQL Dashboard API

**Endpoint:** `POST https://api.certidz.dz/v1/graphql` — same auth (Bearer JWT / `X-Api-Key`) and tenancy rules as REST.

> **Read-only by design.** The GraphQL layer exists for dashboard read aggregation (fewer round trips, flexible projections). **All mutations remain REST** — writes need idempotency keys, webhooks, and audit semantics that we deliberately keep in one place. The schema exposes no `Mutation` type. Query cost analysis caps complexity at 10 000 points/query and depth 8; introspection is enabled for authenticated callers.

### 4.1 SDL

```graphql
"""CertiDZ Dashboard Read API — v1. Read-only; all writes are REST."""
schema {
  query: Query
}

scalar DateTime
scalar Cursor
scalar JSON

enum EnvelopeStatus { DRAFT SENT DELIVERED PARTIALLY_SIGNED COMPLETED DECLINED VOIDED EXPIRED }
enum SignerStatus { CREATED SENT DELIVERED SIGNED DECLINED }
enum SignatureLevel { SIMPLE ADVANCED QUALIFIED }
enum DocumentStatus { AWAITING_UPLOAD PROCESSING AVAILABLE QUARANTINED DELETED }
enum SortDirection { ASC DESC }

type PageInfo {
  nextCursor: Cursor
  hasMore: Boolean!
}

type Organization {
  id: ID!
  name: String!
  legalName: String
  country: String!
  plan: String!
  status: String!
  memberCount: Int!
  createdAt: DateTime!
  dashboardStats(period: StatsPeriod! = LAST_30_DAYS): DashboardStats!
  usage: UsageMetrics!
}

enum StatsPeriod { LAST_7_DAYS LAST_30_DAYS LAST_90_DAYS YEAR_TO_DATE }

type DashboardStats {
  period: StatsPeriod!
  envelopesSent: Int!
  envelopesCompleted: Int!
  completionRate: Float!
  medianTimeToCompleteHours: Float
  pendingSignatures: Int!
  expiringSoon(withinDays: Int! = 7): Int!
  identityVerificationsCompleted: Int!
  certificatesExpiring(withinDays: Int! = 30): Int!
  envelopeVolumeByDay: [DailyCount!]!
}

type DailyCount { date: DateTime!, count: Int! }

type Envelope {
  id: ID!
  title: String!
  status: EnvelopeStatus!
  signatureLevel: SignatureLevel!
  signers: [Signer!]!
  documents: [Document!]!
  metadata: JSON
  expiresAt: DateTime
  sentAt: DateTime
  completedAt: DateTime
  createdBy: User!
  createdAt: DateTime!
  auditEvents(first: Int = 25, after: Cursor): AuditEventConnection!
}

type Signer {
  id: ID!
  fullName: String!
  email: String!
  routingOrder: Int!
  status: SignerStatus!
  signedAt: DateTime
  lastViewedAt: DateTime
}

type EnvelopeConnection {
  edges: [EnvelopeEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type EnvelopeEdge { node: Envelope!, cursor: Cursor! }

input EnvelopeFilter {
  status: [EnvelopeStatus!]
  signerEmail: String
  createdAfter: DateTime
  createdBefore: DateTime
  search: String
}

type Document {
  id: ID!
  fileName: String!
  contentType: String!
  sizeBytes: Int!
  sha256: String!
  status: DocumentStatus!
  version: Int!
  pageCount: Int
  tags: [String!]!
  createdAt: DateTime!
}

type User {
  id: ID!
  fullName: String!
  email: String!
}

type AuditEvent {
  id: ID!
  action: String!
  actorType: String!
  actorId: ID
  actorEmail: String
  resourceType: String!
  resourceId: ID!
  ip: String
  context: JSON
  occurredAt: DateTime!
}

type AuditEventConnection {
  edges: [AuditEventEdge!]!
  pageInfo: PageInfo!
}

type AuditEventEdge { node: AuditEvent!, cursor: Cursor! }

type UsageMetrics {
  periodStart: DateTime!
  periodEnd: DateTime!
  envelopesUsed: Int!
  envelopesLimit: Int!
  aiTokensUsed: Int!
  aiTokensLimit: Int!
  identityVerificationsUsed: Int!
  identityVerificationsLimit: Int!
  storageBytesUsed: Float!
  storageBytesLimit: Float!
}

type Query {
  """Organization in the resolved tenant context."""
  organization: Organization!

  envelope(id: ID!): Envelope

  envelopes(
    filter: EnvelopeFilter
    first: Int = 25
    after: Cursor
    sortBy: String = "createdAt"
    sortDirection: SortDirection = DESC
  ): EnvelopeConnection!

  document(id: ID!): Document

  auditEvents(
    resourceType: String
    resourceId: ID
    occurredAfter: DateTime
    occurredBefore: DateTime
    first: Int = 50
    after: Cursor
  ): AuditEventConnection!
}
```

### 4.2 Example Queries

**Dashboard home:**

```graphql
query DashboardHome {
  organization {
    name
    plan
    dashboardStats(period: LAST_30_DAYS) {
      envelopesSent
      envelopesCompleted
      completionRate
      pendingSignatures
      expiringSoon(withinDays: 7)
    }
    usage { envelopesUsed envelopesLimit aiTokensUsed aiTokensLimit }
  }
  envelopes(filter: { status: [SENT, DELIVERED, PARTIALLY_SIGNED] }, first: 5) {
    totalCount
    edges {
      node {
        id
        title
        status
        expiresAt
        signers { fullName status routingOrder }
      }
    }
    pageInfo { nextCursor hasMore }
  }
}
```

Response:

```json
{
  "data": {
    "organization": {
      "name": "Sonelgaz",
      "plan": "enterprise",
      "dashboardStats": {
        "envelopesSent": 412,
        "envelopesCompleted": 371,
        "completionRate": 0.9,
        "pendingSignatures": 28,
        "expiringSoon": 6
      },
      "usage": { "envelopesUsed": 214, "envelopesLimit": 5000, "aiTokensUsed": 285494, "aiTokensLimit": 20000000 }
    },
    "envelopes": {
      "totalCount": 28,
      "edges": [
        {
          "node": {
            "id": "env_01J1XF2G3H4J5K6L7M8N9P0Q1R",
            "title": "Contrat de fourniture d'électricité HT — Cevital Béjaïa",
            "status": "DELIVERED",
            "expiresAt": "2026-07-15T23:59:59Z",
            "signers": [
              { "fullName": "Amina Benali", "status": "SIGNED", "routingOrder": 1 },
              { "fullName": "Karim Meziane", "status": "DELIVERED", "routingOrder": 2 }
            ]
          }
        }
      ],
      "pageInfo": { "nextCursor": "eyJvIjoxfQ", "hasMore": true }
    }
  }
}
```

**Envelope drill-down with audit history:**

```graphql
query EnvelopeDetail($id: ID!) {
  envelope(id: $id) {
    title
    status
    completedAt
    documents { fileName sha256 pageCount }
    auditEvents(first: 10) {
      edges { node { action actorEmail ip occurredAt } }
      pageInfo { hasMore }
    }
  }
}
```

GraphQL errors reuse the REST error catalog inside `extensions`: `{ "errors": [{ "message": "...", "extensions": { "code": "PERMISSION_DENIED", "traceId": "req_..." } }] }`.

---

## 5. Webhook Event Catalog & Delivery

### 5.1 Event Envelope

Every delivery POSTs one JSON event:

```json
{
  "id": "evt_01J1XK2M3N4P5Q6R7S8T9U0V1W",
  "type": "envelope.completed",
  "apiVersion": "v1",
  "organizationId": "org_01J1X8Z7Y6X5W4V3U2T1S0R9Q8",
  "occurredAt": "2026-07-02T16:41:06Z",
  "data": { "...": "resource snapshot, see catalog" }
}
```

`id` is stable across retries — **use it as your deduplication key**.

### 5.2 Event Catalog

| Event type | Fires when | `data` payload core |
|---|---|---|
| `envelope.sent` | Envelope dispatched to first routing order | envelope summary + signers |
| `envelope.delivered` | A signer opened the envelope | envelope id, signer |
| `envelope.signer.signed` | One signer completed | signer + signatureId |
| `envelope.completed` | All signers done; sealed PDF ready | full envelope + document hashes |
| `envelope.declined` | A signer declined | signer + reason |
| `envelope.voided` | Sender/admin voided | reason, actor |
| `envelope.expired` | `expiresAt` passed with pending signers | envelope summary |
| `signature.applied` | Cryptographic signature affixed | signature detail (cert, timestamp) |
| `document.uploaded` | Finalize succeeded | document metadata |
| `document.quarantined` | AV scan flagged upload | document id, threatName |
| `certificate.issued` | CA issued a certificate | certificate summary |
| `certificate.revoked` | Revocation processed | certificate id, reason, revokedAt |
| `certificate.expiring` | 30/14/3 days before `notAfter` | certificate id, daysRemaining |
| `identity.verified` | KYC adjudicated pass | verification result + scores |
| `identity.rejected` | KYC adjudicated fail | rejectionReasons[] |
| `identity.manual_review` | Routed to human review queue | verification id |
| `workflow.run.completed` | Run reached terminal success | run summary + outputs |
| `workflow.run.failed` | Run failed/rejected/cancelled | failing step, reason |
| `workflow.step.pending_approval` | Approval step awaits assignee | step, assignees, slaDeadline |
| `webhook.ping` | Test delivery via `/webhooks/{id}/test` | `{ "message": "ping" }` |
| `invoice.paid` | Payment captured | invoice summary |
| `invoice.payment_failed` | Charge failed | invoice id, failure reason, retryAt |
| `subscription.updated` | Plan/seat change | old plan, new plan |
| `security.session.revoked` | Refresh-token reuse detected / mass revoke | userId, cause |

**Example — `envelope.completed`:**

```json
{
  "id": "evt_01J1XK2M3N4P5Q6R7S8T9U0V1W",
  "type": "envelope.completed",
  "apiVersion": "v1",
  "organizationId": "org_01J1X8Z7Y6X5W4V3U2T1S0R9Q8",
  "occurredAt": "2026-07-02T16:41:06Z",
  "data": {
    "envelope": {
      "id": "env_01J1XF2G3H4J5K6L7M8N9P0Q1R",
      "title": "Contrat de fourniture d'électricité HT — Cevital Béjaïa",
      "status": "completed",
      "completedAt": "2026-07-02T16:41:05Z",
      "signers": [
        { "id": "sgn_01J1XF3A4B5C6D7E8F9G0H1J2K", "fullName": "Amina Benali", "status": "signed", "signedAt": "2026-07-02T15:47:12Z" },
        { "id": "sgn_01J1XF3B5C6D7E8F9G0H1J2K3L", "fullName": "Karim Meziane", "status": "signed", "signedAt": "2026-07-02T16:41:05Z" }
      ],
      "sealedDocuments": [
        { "documentId": "doc_01J1XEC9D0E1F2G3H4J5K6L7M8", "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
      ],
      "metadata": { "crmRef": "OPP-2026-04471" }
    }
  }
}
```

**Example — `certificate.expiring`:**

```json
{
  "id": "evt_01J1XK5P6Q7R8S9T0U1V2W3X4Y",
  "type": "certificate.expiring",
  "apiVersion": "v1",
  "organizationId": "org_01J1X8Z7Y6X5W4V3U2T1S0R9Q8",
  "occurredAt": "2026-07-02T06:00:00Z",
  "data": {
    "certificate": {
      "id": "cert_01J1XGM6N7P8Q9R0S1T2U3V4W5",
      "subject": "CN=Amina Benali, O=Sonelgaz, C=DZ",
      "notAfter": "2026-08-01T09:00:00Z",
      "daysRemaining": 30,
      "renewalUrl": "https://app.certidz.dz/certificates/cert_01J1XGM6.../renew"
    }
  }
}
```

### 5.3 Delivery Semantics & Signature Verification

**Semantics:**

- **At-least-once.** Duplicates are possible — deduplicate on `event.id`.
- **Ordering is NOT guaranteed** across events (e.g. `envelope.completed` may arrive before the last `envelope.signer.signed`). Reconcile against `occurredAt` and, when in doubt, `GET` the resource.
- **Success** = any `2xx` within **10 s** (connect 3 s). Redirects are not followed.
- **Retry schedule** (exponential backoff): after failure, redeliver at **+1 min → +5 min → +30 min → +2 h → +12 h** (5 retries, ~14.5 h total). Each attempt is logged in `/webhooks/{id}/deliveries`.
- **Auto-disable:** after **50 consecutive failed deliveries** (all retries exhausted) the endpoint flips to `status: "disabled"`; org admins are emailed, and a final `webhook.ping` is attempted on re-enable. Manual redelivery remains available for 30 days.

**Signed payloads (HMAC).** Every delivery includes:

```http
POST /hooks/certidz HTTP/1.1
Host: erp.sonelgaz.dz
Content-Type: application/json
X-CertiDZ-Event: envelope.completed
X-CertiDZ-Delivery: dlv_01J1XK7R8S9T0U1V2W3X4Y5Z6A
X-CertiDZ-Signature: t=1751474466,v1=5f8c2a1de9b47c3f60d2f0aa9e8b17c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8
```

Scheme: `v1 = hex( HMAC_SHA256( secret, t + "." + rawBody ) )` where `t` is the Unix-seconds timestamp at send time and `rawBody` is the **exact raw request body bytes** (do not re-serialize the JSON before verifying).

Verification rules:

1. Parse `t` and all `v1` values from the header (comma-separated `k=v` pairs; multiple `v1` entries may be present during secret rotation).
2. Recompute the HMAC over `"{t}.{rawBody}"` with your endpoint secret.
3. Compare with a **timing-safe** comparison against each provided `v1`. Any match = authentic.
4. Reject if `|now − t| > 300 s` (**5-minute tolerance**) — replay protection.
5. Verify **before** JSON parsing; respond `2xx` fast and process async.

**Node.js / TypeScript verification sample:**

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 300; // 5 minutes

export function verifyCertidzSignature(opts: {
  rawBody: Buffer;          // exact bytes — use express.raw() / fastify rawBody, NOT re-stringified JSON
  signatureHeader: string;  // req.headers["x-certidz-signature"]
  secrets: string[];        // current secret, plus previous secret during rotation
  now?: number;
}): boolean {
  const { rawBody, signatureHeader, secrets, now = Math.floor(Date.now() / 1000) } = opts;

  const parts = new Map<string, string[]>();
  for (const pair of signatureHeader.split(",")) {
    const [k, v] = pair.trim().split("=", 2);
    if (!k || !v) continue;
    parts.set(k, [...(parts.get(k) ?? []), v]);
  }

  const t = Number(parts.get("t")?.[0]);
  const candidates = parts.get("v1") ?? [];
  if (!Number.isFinite(t) || candidates.length === 0) return false;

  // Replay protection: 5-minute tolerance window
  if (Math.abs(now - t) > TOLERANCE_SECONDS) return false;

  const signedPayload = Buffer.concat([Buffer.from(`${t}.`), rawBody]);

  for (const secret of secrets) {
    const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
    for (const candidate of candidates) {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(candidate, "utf8");
      if (a.length === b.length && timingSafeEqual(a, b)) return true; // timing-safe compare
    }
  }
  return false;
}

// Express wiring — raw body is mandatory:
// app.post("/hooks/certidz", express.raw({ type: "application/json" }), (req, res) => {
//   const ok = verifyCertidzSignature({
//     rawBody: req.body,
//     signatureHeader: String(req.headers["x-certidz-signature"] ?? ""),
//     secrets: [process.env.CERTIDZ_WEBHOOK_SECRET!, process.env.CERTIDZ_WEBHOOK_SECRET_PREV ?? ""].filter(Boolean),
//   });
//   if (!ok) return res.status(401).end();
//   res.status(200).end();                     // ack fast…
//   const event = JSON.parse(req.body.toString("utf8"));
//   queue.enqueue(event);                      // …process async, dedupe on event.id
// });
```

### 5.4 Secret Rotation (Dual Signatures)

`POST /webhooks/{id}/rotate-secret` with `{ "graceHours": 24 }` (max 72):

1. A new secret is generated and returned once.
2. During the grace window, every delivery is signed with **both** secrets — the header carries **two `v1` entries**:

```http
X-CertiDZ-Signature: t=1751474466,v1=<hmac-with-new-secret>,v1=<hmac-with-old-secret>
```

3. Your verifier (above) accepts if **any** `v1` matches **any** configured secret — deploy the new secret at your convenience within the window.
4. After the grace window the old secret is destroyed and single-signature delivery resumes.
5. Rotation is audited (`webhook.secret.rotated` in the audit trail) and never disables the endpoint.

---

*CertiDZ by HISN — Platform Architecture. Questions: api-architecture@hisn.dz. Developer portal: https://developers.certidz.dz.*
