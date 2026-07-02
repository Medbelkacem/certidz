# CertiDZ by HISN — Product Requirements Document (PRD)

| | |
|---|---|
| **Document version** | 1.3 |
| **Status** | Approved for MVP execution |
| **Owner** | Product Management, HISN |
| **Last updated** | 2026-07-02 |
| **Reviewers** | Engineering Lead, Security Officer, Legal/Compliance Counsel, QA Lead |
| **Classification** | Internal — Confidential |

---

## 1. Vision

**CertiDZ is the trusted, AI-powered digital trust platform for Algeria and Africa.** It lets any individual, business, or public institution sign documents with legal effect, verify identities remotely, and automate document-centric workflows — in Arabic, French, and English — while meeting Algerian Law 15-04, eIDAS-equivalent assurance levels, GDPR, and ISO 27001 requirements.

**One-sentence pitch:** *DocuSign + Onfido + a compliance brain, built for the Algerian legal framework first and the African continent next.*

### 1.1 Problem statement

- Algerian organizations still print, wet-sign, scan, and courier documents. A single procurement contract signature cycle averages **9–14 days** in the public sector.
- Law No. 15-04 of 1 February 2015 established the legal validity of electronic signatures and e-certification in Algeria, but **adoption tooling is nearly absent**: no dominant local platform offers qualified-signature UX, Arabic RTL support, and local payment rails (CIB/EDAHABIA).
- International platforms (DocuSign, Adobe Sign) do not integrate with Algerian national certification authorities, do not support DZD billing or local cards, are priced in hard currency (a barrier under exchange controls), and offer no data residency in Algeria.
- Remote identity verification (bank account opening, SIM registration, insurance KYC) is manual, fraud-prone, and slow.

### 1.2 Strategic goals (24 months)

1. Become the **reference e-signature platform in Algeria** with ≥ 40% share of new digital-signature seat purchases.
2. Be **audit-ready against Law 15-04 and its implementing decrees**, and certified ISO/IEC 27001 by month 18.
3. Expand to **3 additional African markets** (Tunisia, Senegal, Côte d'Ivoire) with localized trust frameworks by month 24.
4. Process **1M+ signature transactions/year** and **500K identity verifications/year** by end of year 2.

---

## 2. Market analysis

### 2.1 Regulatory context — Algeria

| Instrument | Relevance to CertiDZ |
|---|---|
| **Law No. 15-04 (1 Feb 2015)** on electronic signature and electronic certification | Defines the *simple* vs *qualified* electronic signature; a qualified signature (based on a qualified certificate and created by a secure signature-creation device) has the same legal effect as a handwritten signature. CertiDZ must map its signature levels 1:1 to this taxonomy. |
| **National Authority of Electronic Certification (ANCE / Autorité Nationale de Certification Électronique)** | Root of the national trust scheme. Governs the governmental (AGCE) and economic (AECE) branches. |
| **Economic Certification Authority (AECE, under ARPCE oversight)** | Accredits third-party Certification Service Providers (CSPs) serving the private/economic sector. CertiDZ must either integrate accredited CSPs or pursue accreditation itself (see Roadmap, National Scale phase). |
| **ARPCE (Autorité de Régulation de la Poste et des Communications Électroniques)** | Telecom/e-comms regulator; oversees the economic branch of e-certification and electronic communications compliance. |
| **Law 18-07 (10 June 2018)** on personal data protection | Algerian data-protection law (ANPDP authority). Consent, purpose limitation, cross-border transfer restrictions — drives our **data residency in Algeria** requirement for Algerian tenants. |
| **Law 18-05** on e-commerce | Governs online contracting; relevant to billing and consumer-facing flows. |
| **eIDAS (EU 910/2014, amended by eIDAS 2.0)** | Not binding in Algeria but the de-facto technical reference (AdES formats, LTV, QSCD concepts). CertiDZ is "eIDAS-ready" to ease EU-facing use cases and future mutual recognition. |

**Design consequence:** every signature CertiDZ produces must carry machine-readable metadata identifying its assurance level (Simple / Advanced / Qualified per 15-04), the issuing CA chain, and the applicable legal regime, so a court or auditor can classify it without vendor assistance.

### 2.2 Market sizing (directional, for planning)

- Algeria: ~4.4M economic entities registered (CNRC), ~45M inhabitants, > 70% internet penetration, > 50M mobile subscriptions.
- Serviceable segments year 1: banks (20+ retail banks), insurers (~24 companies), notaries (~2,400 offices), law firms, universities (110+ public institutions), municipalities (1,541 communes), hospitals/CHUs, and SMEs in import/export needing certified documents.
- Pricing reality: purchasing in **DZD via CIB/EDAHABIA is mandatory** for public sector and strongly preferred by SMEs; EUR/USD (Stripe/PayPal) for diaspora, exporters, and pan-African customers.

### 2.3 Competitive landscape

| Competitor | Strengths | Gaps CertiDZ exploits |
|---|---|---|
| DocuSign / Adobe Sign | Brand, ecosystem | No Law 15-04 mapping, no DZD/local cards, no Algerian data residency, weak Arabic RTL |
| Local scan-and-stamp workflows | Zero cost, familiar | No legal-grade signature, no audit trail, slow |
| Regional players (e.g., Tunisian/Moroccan CSP portals) | Local trust anchors | Single-country, poor UX, no AI, no workflow engine |
| In-house bank/government portals | Control | Expensive to maintain; CertiDZ offers white-label/on-prem Enterprise Edition |

### 2.4 Differentiators

1. **Law 15-04-native**: signature levels, evidence files, and archival aligned to Algerian legal taxonomy out of the box.
2. **Tri-lingual with true RTL** (Arabic-first UI, French, English) across product, PDFs, emails, and audit trails.
3. **Local payments**: CIB/EDAHABIA (SATIM gateway) + Stripe + PayPal + bank transfer with proforma invoicing.
4. **AI document intelligence** tuned on bilingual (AR/FR) legal and administrative documents.
5. **Sovereign deployment options**: SaaS (Algerian data center), private cloud, on-prem Kubernetes for government.

---

## 3. Personas

### P1 — Amina, Notary (Étude notariale, Constantine)
- 52, runs a 6-person office; drafts deeds, powers of attorney, company statutes.
- **Goals:** legally defensible signatures, sequential signing (parties then notary seal), permanent archival.
- **Pain:** parties travel hours to sign; paper archives; fear of forgery.
- **Success:** completes a remote power-of-attorney flow with qualified signatures and a court-admissible evidence file in < 1 day.

### P2 — Karim, Compliance Officer (Retail bank, Algiers)
- 38, owns KYC/AML for account opening; reports to the bank's risk committee and Bank of Algeria supervisors.
- **Goals:** remote onboarding with document OCR + face match + liveness + NFC passport read; full audit trail; configurable retention.
- **Pain:** branch queues; manual document review with 8% error rate; fraud rings using photo-of-photo attacks.
- **Success:** < 3-minute median verification, < 0.5% fraud pass-through, exportable audit evidence per case.

### P3 — Yacine, SME Founder (Import/export, 12 employees, Oran)
- 31, signs supplier contracts, customs mandates, HR documents.
- **Goals:** cheap, fast, mobile-first signing; pay in DZD with EDAHABIA.
- **Pain:** can't justify $40/user/month USD tools; needs French + Arabic documents.
- **Success:** sends a contract from his phone; counterparty signs in minutes; pays 2,900 DZD/month.

### P4 — Prof. Leïla, University Registrar (Public university, Batna)
- 47, issues thousands of diplomas, transcripts, and internship conventions per year.
- **Goals:** bulk-sign diplomas with a qualified institutional seal; QR verification portal for employers; integration with the student information system.
- **Pain:** diploma fraud; verification letters take weeks; ministry audits.
- **Success:** batch-seals 5,000 diplomas in one run; any employer verifies authenticity via QR in < 10 seconds.

### P5 — Nadir, IT Director (Wilaya administration / municipality)
- 44, manages digital transformation projects for a public administration.
- **Goals:** on-prem or sovereign-cloud deployment, Arabic-first UI, SSO with the administration's directory, workflow routing across departments, tender-compliant procurement.
- **Pain:** vendors that can't deploy air-gapped; no Arabic support; opaque pricing.
- **Success:** deploys Enterprise Edition on the administration's Kubernetes cluster; processes citizen-facing certificates with digital seals.

### P6 — Sara, Legal Counsel (Insurance company, Algiers)
- 35, reviews and dispatches hundreds of contracts monthly.
- **Goals:** AI-assisted contract review (clause extraction, risk flags, missing-signature detection), template library, parallel signing for multi-party policies.
- **Pain:** repetitive review; missed renewal clauses; version chaos.
- **Success:** AI pre-review cuts her per-contract time from 45 to 12 minutes with zero missed mandatory clauses in audits.

### P7 — Mehdi, Freelance Developer / API integrator (secondary persona)
- 27, builds a proptech app; wants embedded signing and identity verification via API/SDK.
- **Goals:** clean REST API, webhooks, sandbox, transparent metered pricing.
- **Success:** embedded signing live in his app within 2 days using sandbox keys and docs.

### P8 — Platform Support Agent (internal persona)
- Needs impersonation-with-consent, tenant health dashboards, and refund tooling without ever seeing document content.

---

## 4. Product scope — modules and functional requirements

Requirement IDs use the pattern `MOD-##`. Priority: **P0** = MVP blocker, **P1** = V1, **P2** = Enterprise/later.

### 4.1 Authentication & Access (AUTH)

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | Email + password auth with Argon2id hashing (m=64MB, t=3, p=4), breach-corpus password screening, and rate limiting (5 failures → 15-min lockout with exponential backoff). | P0 |
| AUTH-02 | MFA: TOTP (RFC 6238), SMS OTP (Algerian operators via local SMS gateway + Twilio fallback), and email OTP. MFA enforceable per-tenant policy. | P0 |
| AUTH-03 | **WebAuthn/passkeys** (FIDO2): platform and roaming authenticators; passkey-only accounts supported; attestation stored for audit. Passkeys usable as signature-authorization factor. | P0 |
| AUTH-04 | Session management: JWT access tokens (15 min) + rotating refresh tokens (7 days, revocable), device list with remote revocation, concurrent-session limits per plan. | P0 |
| AUTH-05 | SSO: SAML 2.0 and OIDC (Azure AD/Entra, Google Workspace, Keycloak); JIT provisioning with domain claim verification. | P1 |
| AUTH-06 | SCIM 2.0 user lifecycle provisioning for Enterprise. | P2 |
| AUTH-07 | Step-up authentication: qualified-signature actions always require a fresh second factor within the last 5 minutes (re-auth challenge). | P0 |
| AUTH-08 | Delegated access ("act on behalf of") with time-boxed grants and full audit trail; never for signing acts. | P1 |

### 4.2 Digital Identity Verification (IDV)

| ID | Requirement | Priority |
|---|---|---|
| IDV-01 | Document capture & OCR for: Algerian CNIBE (biometric national ID), Algerian biometric passport, driving licence, residence card; extensible template system for other African IDs. Extract MRZ + visual zone; cross-check MRZ checksum digits. | P0 |
| IDV-02 | Face match: selfie vs. ID portrait, similarity score 0–1; default accept threshold 0.85, tenant-configurable within [0.75, 0.95]. | P0 |
| IDV-03 | Liveness detection: passive (single-frame + micro-texture) mandatory; active challenge (head turn, blink) as step-up. Must meet **ISO/IEC 30107-3 PAD Level 2** resistance targets (see Testing Strategy). | P0 |
| IDV-04 | **NFC chip reading** of ICAO 9303 eMRTDs (biometric passport, CNIBE): BAC/PACE, passive authentication against CSCA certs, clone detection via active/chip authentication where supported. Mobile app + PWA WebNFC (Android) support. | P1 |
| IDV-05 | Verification session API: create session → user completes on mobile/web → webhook result (`approved`, `rejected`, `needs_review`) with reason codes and confidence scores. | P0 |
| IDV-06 | Manual review console: side-by-side document/selfie, zoom, fraud indicators (screen-recapture moiré, font tampering, photo substitution), 4-eyes option, SLA timers. | P0 |
| IDV-07 | Reusable verified identity ("CertiDZ ID"): once verified at a given assurance level, a user can consent to share the verification result with another tenant without re-capturing (validity window 12 months, revocable). | P2 |
| IDV-08 | PII handling: biometric templates encrypted (AES-256-GCM, per-tenant DEK under KMS-managed KEK), raw selfie/document media auto-purged per tenant retention policy (default 90 days), audit metadata retained separately. | P0 |

### 4.3 Digital Signature (SIG)

| ID | Requirement | Priority |
|---|---|---|
| SIG-01 | **Signature levels:** (a) *Simple* — click-to-sign with authenticated intent record; (b) *Advanced* — signer-unique certificate (platform CA), sole-control key usage, tamper-evident; (c) *Qualified* — certificate from an accredited Algerian CSP or eIDAS QTSP, key in QSCD/HSM. Level recorded in evidence file, mapped to Law 15-04 articles. | P0 (a,b) / P1 (c) |
| SIG-02 | **Formats:** PAdES B-B/B-T/B-LT/B-LTA for PDF; XAdES B/T/LT/LTA for XML; CAdES for binary payloads (detached). ASiC-E containers for multi-file signed bundles. | P0 (PAdES B-T), P1 (LT/LTA, XAdES, CAdES, ASiC) |
| SIG-03 | **Long-Term Validation (LTV):** embed full certificate chain, OCSP responses/CRLs, and RFC 3161 timestamps at signing time; automated **LTA re-timestamping job** before timestamp-certificate expiry (scheduler with 90-day lead alerting). | P1 |
| SIG-04 | **Timestamping:** RFC 3161 TSA integration (primary: accredited Algerian TSA when available; fallback: qualified EU TSA); every non-simple signature is timestamped. | P0 |
| SIG-05 | **Sequential and parallel signing orders:** envelope supports ordered steps (1→2→3), parallel groups (any order within a step), and hybrid (step 1 parallel group of 3 → step 2 approver → step 3 seal). Per-recipient roles: Signer, Approver, CC/Viewer, Certifier (seal). | P0 |
| SIG-06 | Signing ceremony UX: field placement (signature, initials, date, text, checkbox, dropdown, attachment request), mandatory-field enforcement, consent-to-electronic-business disclosure (AR/FR/EN), draw/type/upload visual signature, geolocation + IP + user agent captured. | P0 |
| SIG-07 | **Evidence file:** per completed envelope, a sealed PDF "Certificate of Completion" + machine-readable JSON: all events (sent, viewed, authenticated, signed) with UTC timestamps, hash chain (SHA-256) of document versions, authentication methods used, signature level per signer. Evidence file itself is platform-sealed (PAdES). | P0 |
| SIG-08 | **Verification portal (public):** upload a PDF or scan a QR code on the document → validation report: signature integrity, chain trust, revocation status at signing time, timestamp validity, Law 15-04 level classification. No account required. Rate-limited (30 req/hour/IP anonymous). | P0 |
| SIG-09 | Bulk/batch signing: up to 5,000 documents per batch with a single organizational seal authorization (HSM-backed), progress reporting, partial-failure retry. | P1 |
| SIG-10 | Digital seals (legal-entity certificates) for organizations: diploma sealing, invoice sealing (e-invoicing readiness). | P1 |
| SIG-11 | Signature via API: create envelope, embedded signing iframe/redirect with signed session tokens, webhooks (`envelope.completed`, `recipient.signed`, `envelope.declined`, `envelope.expired`). | P0 |
| SIG-12 | Decline/reassign: recipient may decline with reason or reassign to a colleague if the sender allowed it; both fully audited. | P0 |
| SIG-13 | Expiration & reminders: envelope expiry (default 30 days, 1–365 configurable), automatic reminders (default day 3, 7, then every 7). | P0 |
| SIG-14 | Key management: signer keys generated and used **only inside HSM/KMS boundary** (never exported); FIPS 140-2 Level 3 (or eIDAS-certified QSCD) for Advanced/Qualified; sole-control enforced via signer-specific authorization (passkey or OTP bound to key-usage request). | P0 |

### 4.4 AI Assistant & Document Intelligence (AI)

| ID | Requirement | Priority |
|---|---|---|
| AI-01 | Document classification (contract, invoice, ID, diploma, PV/minutes, power of attorney…) ≥ 92% accuracy on the golden set; auto-suggests workflow templates. | P1 |
| AI-02 | Contract review assistant: clause extraction (parties, effective date, term, renewal, termination, penalties, governing law, signature blocks), risk flags with severity, missing-clause checklist per contract type. Bilingual AR/FR; EN supported. | P1 |
| AI-03 | Smart field detection: auto-place signature/date/name fields on uploaded PDFs (anchor-text + layout model), ≥ 85% correct placement on the golden set; user can always adjust. | P1 |
| AI-04 | Summarization & Q&A over a document or a folder (RAG over tenant documents in Elasticsearch), with **citations to page/paragraph**; answers without a supporting citation are refused. | P1 |
| AI-05 | AI guardrails: (a) no AI output is ever auto-signed or auto-sent — human confirmation mandatory; (b) all AI suggestions are labeled "AI-generated — verify before use"; (c) per-tenant AI opt-out; (d) no tenant data used for cross-tenant model training; (e) prompts and outputs logged for audit (tenant-visible). | P0 (as policy from first AI feature) |
| AI-06 | OCR for scanned documents: printed Arabic + French + English, searchable-PDF generation; target CER ≤ 2% printed FR/EN, ≤ 4% printed AR on golden set. | P1 |
| AI-07 | Fraud-signal assist in IDV review console (tamper heatmaps, recapture score) — advisory only, never auto-rejects at qualified level. | P1 |

### 4.5 Document Management (DOC)

| ID | Requirement | Priority |
|---|---|---|
| DOC-01 | Upload PDF, DOCX, XLSX, PPTX, PNG/JPG (converted to PDF for signing); max 100 MB/file, 500 MB/envelope; antivirus scan (ClamAV + heuristics) before storage; malformed-PDF sanitization. | P0 |
| DOC-02 | Folder hierarchy, tags, saved filters; full-text search (Elasticsearch) over content + metadata with AR/FR/EN analyzers; results in < 800 ms p95. | P0 |
| DOC-03 | Versioning: immutable version history; signed versions are frozen (WORM semantics); diff viewer for text-extractable versions. | P1 |
| DOC-04 | Storage: S3-compatible, SSE with per-tenant keys, object-lock (compliance mode) for signed documents and evidence files. | P0 |
| DOC-05 | Sharing: internal share (role-aware), external share links with password + expiry + download limits + watermarking; all access audited. | P0 |
| DOC-06 | Retention & legal hold: per-tenant, per-document-class retention schedules; legal hold overrides deletion; certified deletion report on purge. | P1 |
| DOC-07 | Templates library: reusable envelope templates with roles, fields, and routing pre-configured; org-level and personal templates. | P0 |

### 4.6 Workflow Automation (WF)

| ID | Requirement | Priority |
|---|---|---|
| WF-01 | Visual workflow builder (drag-drop): triggers (document uploaded, form submitted, API call, schedule), steps (approval, signature envelope, IDV, AI review, webhook, conditional branch, delay, parallel split/join), and end states. | P1 |
| WF-02 | Conditional routing on document metadata, form fields, AI extraction results (e.g., "if contract value > 10M DZD → add CFO approval step"). | P1 |
| WF-03 | SLA timers & escalation: per-step deadlines, auto-escalate to manager, breach notifications. | P1 |
| WF-04 | Workflow templates gallery: procurement approval, HR onboarding pack, notarial deed, diploma issuance, insurance claim, tender submission. | P1 |
| WF-05 | Execution log per instance: step timeline, actor, inputs/outputs hashes; exportable. | P1 |
| WF-06 | Public web forms as workflow triggers (citizen/customer intake) with optional IDV step. | P2 |

### 4.7 Collaboration (COL)

| ID | Requirement | Priority |
|---|---|---|
| COL-01 | Comments and @mentions on documents (pre-signature only; signed docs are read-only), threaded, with email/in-app notification. | P1 |
| COL-02 | Real-time presence & co-review (who is viewing; field placement co-editing with conflict resolution via last-writer-wins + operation log). | P2 |
| COL-03 | Teams/spaces: shared folders, shared templates, team inboxes for incoming envelopes. | P1 |
| COL-04 | Guest collaborators (external counsel) with scoped, expiring access. | P1 |

### 4.8 Analytics & Reporting (ANA)

| ID | Requirement | Priority |
|---|---|---|
| ANA-01 | Tenant dashboard: envelopes sent/completed/declined/expired, median time-to-completion, IDV pass rates, seat and API usage vs. plan. | P0 (basic) |
| ANA-02 | Funnel analytics: per-template completion funnel (sent → viewed → started → completed) with drop-off points. | P1 |
| ANA-03 | Compliance reports: signature-level distribution, retention compliance, audit-log export (CSV/JSON, cryptographically chained). | P1 |
| ANA-04 | Scheduled report emails (weekly/monthly PDF) per team. | P1 |
| ANA-05 | Platform analytics (internal): MAU, activation, conversion, NRR, per-tenant health scores. | P0 |

### 4.9 Administration (ADM)

| ID | Requirement | Priority |
|---|---|---|
| ADM-01 | Multi-tenant organizations: org → workspaces/teams → members; tenant-level branding (logo, colors, email sender domain with DKIM), custom subdomain. | P0 |
| ADM-02 | RBAC with the fixed role set (Owner, Admin, Compliance Officer, Team Manager, Member, Auditor) + custom roles (Enterprise) composed from the permission catalog. See ADMIN-GUIDE for the matrix. | P0 |
| ADM-03 | Tenant policy engine: MFA enforcement, allowed signature levels, IP allowlists, session duration, allowed IDV document types, retention defaults, AI on/off. | P0 |
| ADM-04 | Immutable audit log: every security-relevant and document-lifecycle event; hash-chained (each entry includes SHA-256 of previous), exportable, minimum 10-year retention for signature events. | P0 |
| ADM-05 | Platform SuperAdmin console (HISN internal): tenant lifecycle, plan overrides, feature flags, support impersonation **with tenant-admin consent and no document-content access**, health dashboards. | P0 |
| ADM-06 | Data residency controls: Algerian tenants pinned to DZ region; region visible in admin UI; cross-region transfer requires documented legal basis. | P1 |

### 4.10 Notifications (NOT)

| ID | Requirement | Priority |
|---|---|---|
| NOT-01 | Channels: email (transactional, localized AR/FR/EN with correct RTL templates), in-app, SMS (signature requests + OTP), and webhooks. Push notifications on PWA/mobile. | P0 (email/in-app), P1 (SMS/push) |
| NOT-02 | Per-user notification preferences with per-event granularity; tenant can enforce minimums (e.g., signature requests cannot be muted). | P1 |
| NOT-03 | Delivery guarantees: transactional email p95 delivery hand-off < 60 s; retry with dead-letter queue; bounce/complaint handling with sender-reputation monitoring. | P0 |

### 4.11 Compliance (CMP)

| ID | Requirement | Priority |
|---|---|---|
| CMP-01 | Law 15-04 mapping pack: legal classification of each signature level, evidence-file conformity, archival duration compliance (10-year default for signed acts). | P0 |
| CMP-02 | GDPR/Law 18-07 rights tooling: data export (machine-readable), erasure with signed-document carve-out (legal-obligation exemption documented in the deletion report), consent records. | P1 |
| CMP-03 | ISO 27001 support: control evidence exports, access reviews (quarterly attestation workflow), key-ceremony records. | P1 |
| CMP-04 | eIDAS-readiness: AdES baseline profiles validated against ETSI conformance test suites; EU Trusted List consumption for cross-border verification. | P1 |
| CMP-05 | Penetration test cadence: external pentest before GA and annually; critical findings fixed before release (CI gate ties to open-finding register). | P0 |

### 4.12 Billing (BIL)

| ID | Requirement | Priority |
|---|---|---|
| BIL-01 | Plans: Free, Pro, Business, Enterprise, Government (see ROADMAP §Pricing). Seat-based + metered add-ons (envelopes beyond quota, IDV checks, API calls, AI credits). | P0 |
| BIL-02 | Payment rails: Stripe (cards, EUR/USD), PayPal, **CIB/EDAHABIA via SATIM/e-payment gateway (DZD)**, and bank transfer with proforma → invoice reconciliation workflow (manual matching UI + reference codes). | P0 (Stripe + bank transfer), P1 (CIB/EDAHABIA, PayPal) |
| BIL-03 | Invoicing: sequential numbered invoices, DZD/EUR/USD, Algerian fiscal mentions (NIF, RC, AI, TVA 19%), PDF invoices sealed with the platform seal. | P0 |
| BIL-04 | Dunning: card failure retries (3, 5, 7 days), grace period 14 days, downgrade-not-delete on non-payment (documents remain readable and verifiable). | P1 |
| BIL-05 | Usage metering pipeline: event-sourced, idempotent, reconciled daily; discrepancy alarm at > 0.1%. | P0 |

### 4.13 Mobile & PWA (MOB)

| ID | Requirement | Priority |
|---|---|---|
| MOB-01 | Installable PWA: offline document reading (already-downloaded), queued actions (sign intent, comments) replayed on reconnect with conflict handling; camera capture for IDV. | P1 |
| MOB-02 | Responsive signing ceremony usable on 360-px-wide screens; touch signature drawing; < 2.5 s LCP on 3G Fast profile. | P0 |
| MOB-03 | Native companion app (React Native, later phase) for NFC eMRTD reading and passkey-based signing authorization. | P2 |
| MOB-04 | Low-bandwidth mode: progressive PDF rendering (page-by-page), image compression, total signing-flow payload ≤ 1.5 MB excluding the document itself. | P1 |

---

## 5. Top 30 features — user stories with acceptance criteria

Format: **US-## — Title** · *As a … I want … so that …* · AC = acceptance criteria (Given/When/Then, testable).

---

**US-01 — Sign a document (simple/advanced)** — *As a signer, I want to open a signature request and sign in under two minutes so that agreements close fast.*
- AC1: Given a valid envelope link, when the signer authenticates per the envelope's auth policy (email link, OTP, or account), then the document renders page 1 in ≤ 3 s p95 on 4G.
- AC2: Given required fields, when any required field is empty, then "Finish" is disabled and unfilled fields are listed and deep-linked.
- AC3: When the signer completes, then the signature is applied (PAdES B-T minimum for Advanced), the evidence log records timestamp (UTC, ±1 s of NTP), IP, user agent, and auth method, and all parties who opted in receive completion emails within 60 s.
- AC4: Signed PDF passes Adobe Acrobat validation ("Signature is valid") and the CertiDZ verification portal with zero warnings.

**US-02 — Send for signature** — *As a sender, I want to upload a document, place fields, add recipients, and send so that I collect signatures remotely.*
- AC1: Upload of a 20 MB PDF completes in ≤ 10 s p95 on a 10 Mbps link, with antivirus scan verdict before the editor opens.
- AC2: Drag-drop field placement snaps to a grid; fields can be assigned per recipient with distinct colors; keyboard-only placement is possible (WCAG).
- AC3: On send, each recipient gets a localized email (recipient's language, RTL-correct if Arabic) within 60 s; envelope status becomes `sent`.
- AC4: Sender can void the envelope any time before completion; voiding notifies all pending recipients and is audited.

**US-03 — Sequential signing order** — *As a sender, I want ordered routing (employee → manager → HR) so that approvals happen in the right sequence.*
- AC1: Recipient 2 receives no notification and cannot access the envelope (HTTP 403 with human-readable explanation) until recipient 1 completes.
- AC2: If recipient 1 declines, the envelope becomes `declined`, downstream recipients are never notified, and the sender is notified with the decline reason within 60 s.
- AC3: Reordering recipients is allowed only while the envelope is in `draft`.

**US-04 — Parallel signing group** — *As a sender, I want 3 board members to sign in any order so that no one blocks the others.*
- AC1: All members of a parallel group are notified simultaneously; each sees only their own required fields as mandatory.
- AC2: Concurrent signing by two members within the same second produces two distinct, valid signatures (serialized server-side; no document corruption; verified by validation portal).
- AC3: The step completes only when all group members have signed; hybrid flows (parallel group → sequential approver) route correctly.

**US-05 — Qualified signature with CSP certificate** — *As a notary, I want to sign with my qualified certificate so that the deed has handwritten-equivalent legal effect under Law 15-04.*
- AC1: Given an enrolled qualified certificate (accredited CSP), when signing, then step-up authentication (fresh passkey/OTP ≤ 5 min old) is required before key usage; absent step-up, signing is refused.
- AC2: The resulting signature is PAdES B-LT with embedded OCSP/CRL and qualified timestamp; the evidence file records level = "Qualified (Law 15-04)".
- AC3: If the certificate is revoked or expired at signing time, signing is blocked with an explicit error and audit entry — never a silent downgrade to Advanced.

**US-06 — Verify a signature via QR / upload** — *As any third party, I want to verify a CertiDZ-signed document without an account so that I can trust what I received.*
- AC1: Scanning the document QR opens the verification page showing: document SHA-256 match/mismatch, signer names, signature levels, timestamps, certificate chain status, and revocation status **at signing time**.
- AC2: Uploading a tampered PDF (any byte changed post-signature) yields a clear red "INVALID — document modified after signing" verdict; uploaded files are processed in memory/ephemeral storage and purged within 1 h.
- AC3: Verification completes in ≤ 5 s p95 for a 20 MB PDF; result page available in AR/FR/EN.

**US-07 — Long-Term Validation (LTA) maintenance** — *As a compliance officer, I want signatures to remain verifiable for 10+ years so that archived acts survive certificate expiry.*
- AC1: Documents flagged for long-term archival are upgraded to PAdES B-LTA; the re-timestamping job runs at least 90 days before the newest embedded timestamp certificate expires.
- AC2: A dashboard lists documents by "LTV health" (healthy / re-stamp due < 90 d / at risk); at-risk count > 0 triggers an admin alert.
- AC3: A document re-stamped 2 times still validates as LTA in the ETSI validation suite and in Adobe Acrobat.

**US-08 — MFA enrollment & enforcement** — *As a tenant admin, I want to enforce MFA for all members so that account takeover risk is reduced.*
- AC1: When the policy is enabled, members without MFA are forced into enrollment at next login and cannot skip more than 0 times (hard enforcement) or 3 times (grace mode), per admin choice.
- AC2: TOTP enrollment shows QR + manual key; verification requires one valid code; 10 single-use recovery codes are generated and downloadable exactly once.
- AC3: Losing all factors triggers the recovery flow: identity re-verification (IDV) or admin-approved reset with 24 h delay and notification to the account's email; all resets audited.

**US-09 — Passkey sign-in and signature authorization** — *As a user, I want to sign in and authorize signatures with my fingerprint/Face ID so that it's both easier and stronger than passwords.*
- AC1: Passkey registration works on Chrome/Safari/Edge/Firefox current-2 versions, Android ≥ 10, iOS ≥ 16; the credential is discoverable (resident key).
- AC2: Passkey login completes in ≤ 5 s p95; fallback to password+OTP remains available unless the tenant enforces passkey-only.
- AC3: When used as signature step-up, the WebAuthn assertion (challenge bound to envelope ID + document hash) is stored in the evidence file.

**US-10 — Remote identity verification (full KYC)** — *As a bank compliance officer, I want customers to verify ID + face + liveness remotely so that account opening is fast and safe.*
- AC1: Median happy-path completion ≤ 3 min; session survives app backgrounding and network drops (resumable for 24 h).
- AC2: MRZ checksum failures, expired documents, and under-18 DOB auto-reject with specific reason codes; all thresholds logged with the model version used.
- AC3: Results delivered via webhook ≤ 30 s after completion with `approved | rejected | needs_review`, sub-scores (doc authenticity, face match, liveness), and a signed (JWS) result payload.
- AC4: Photo-of-screen and printed-photo attacks from the internal spoof corpus are rejected at ≥ 98% (see Testing Strategy).

**US-11 — NFC passport/CNIBE chip read** — *As a verifier, I want chip-level identity data so that assurance is cryptographic, not visual.*
- AC1: On supported Android devices, WebNFC/app reads DG1/DG2 after BAC/PACE using MRZ-derived keys; passive authentication validates SOD against the CSCA store; result recorded as assurance "chip-verified".
- AC2: A cloned chip (failing chip/active authentication where the document supports it) is flagged `needs_review` with reason `chip_auth_failed`.
- AC3: Unsupported device → graceful fallback to optical flow, with assurance level downgraded and visible to the tenant.

**US-12 — Manual review console** — *As an IDV reviewer, I want a queue with evidence side-by-side so that I resolve `needs_review` cases quickly and consistently.*
- AC1: Queue is ordered by SLA breach risk; each case shows doc images, selfie, sub-scores, fraud heatmaps, and prior attempts by the same document number.
- AC2: Reviewer decisions require a reason code; 4-eyes mode (second reviewer) is enforceable per tenant for rejections.
- AC3: p95 console load per case ≤ 2 s; reviewer throughput and inter-reviewer agreement are reported weekly.

**US-13 — AI contract review** — *As legal counsel, I want AI to extract clauses and flag risks so that my review time drops.*
- AC1: For contracts in the golden set (AR/FR), party names, dates, term, renewal, and termination clauses extract with ≥ 90% F1; every extraction shows a clickable citation highlighting the source span.
- AC2: The missing-clause checklist for the selected contract type shows found/missing status; a "missing" verdict requires a full-document scan (no truncation) or an explicit "document too long — partial analysis" banner.
- AC3: Every AI panel displays the "AI-generated — verify before use" label; no AI action modifies the document without an explicit user click; the AI never claims a signature is legally valid (validity verdicts come only from the cryptographic verifier).

**US-14 — AI document Q&A with citations** — *As a user, I want to ask "when does this lease expire?" so that I get answers without reading 40 pages.*
- AC1: Answers include ≥ 1 citation (page + highlighted span); if retrieval confidence is below threshold, the assistant answers "I can't find this in the document" rather than guessing (measured: ≤ 2% unsupported-claim rate on the golden Q&A set).
- AC2: Q&A respects permissions: a user can only query documents they can read (verified by authorization tests).
- AC3: p95 answer latency ≤ 8 s for documents ≤ 100 pages.

**US-15 — Smart field auto-placement** — *As a sender, I want AI to place signature fields so that envelope prep takes seconds.*
- AC1: On the golden layout set, ≥ 85% of suggested fields are accepted without moving; suggestions are visually distinct until confirmed.
- AC2: Undo/clear-all restores the pristine document in one action.

**US-16 — Envelope templates** — *As a team manager, I want reusable templates so that recurring documents (NDAs, work orders) are sent in one minute.*
- AC1: A template stores document(s), roles, fields, routing, expiry, and message; creating an envelope from a template requires only recipient assignment.
- AC2: Template changes are versioned; in-flight envelopes are never affected by template edits.
- AC3: Org templates are permission-gated (Members can use; only Team Managers+ can edit, per RBAC matrix).

**US-17 — Bulk send** — *As HR, I want to send one template to 800 employees (each their own envelope) so that annual policy acknowledgment is automated.*
- AC1: CSV upload (name, email, custom fields) with validation preview showing row-level errors before send; sending 800 envelopes completes ≤ 10 min with progress bar.
- AC2: Per-recipient merge fields render correctly (including Arabic names in RTL); failures are retried 3× then listed in an exportable error report.

**US-18 — Bulk seal (diplomas)** — *As a university registrar, I want to seal 5,000 diplomas in one batch so that graduation processing takes hours, not weeks.*
- AC1: Batch job seals ≥ 10 docs/s sustained (HSM-backed); a single step-up authorization covers the batch, recorded with batch manifest hash.
- AC2: Each diploma gets a unique QR verification code; spot-check of 50 random outputs validates 100% in the portal.
- AC3: Partial failure (e.g., doc 3,412 corrupt) skips-and-reports without aborting the batch.

**US-19 — Workflow builder** — *As an operations lead, I want to build "upload → AI check → manager approval → signature → archive" visually so that no developer is needed.*
- AC1: The builder validates the graph on save (no orphan steps, no infinite loops, all branches terminate); invalid graphs cannot be activated.
- AC2: A test-run mode executes with sample data and shows step-by-step results without sending real notifications.
- AC3: Conditional branch on an AI-extracted amount routes correctly in test and production (verified with boundary values: below, equal, above threshold).

**US-20 — Workflow SLA escalation** — *As a manager, I want overdue approvals escalated so that documents never stall silently.*
- AC1: A step overdue by its SLA (e.g., 48 h) triggers escalation exactly once to the configured escalatee, plus daily reminders after.
- AC2: Escalations respect working-day calendars (Algerian weekend Fri–Sat, tenant-configurable holidays).

**US-21 — Document search** — *As a user, I want to find "the 2025 supplier contract with SARL Atlas" in seconds so that I stop digging in folders.*
- AC1: Full-text search across content + metadata returns results in ≤ 800 ms p95 (index of 1M docs); AR/FR/EN queries work with language-appropriate stemming/normalization (including Arabic diacritic-insensitivity).
- AC2: Results honor permissions (proven by automated cross-tenant and cross-role leak tests: zero leaks tolerated).
- AC3: Filters: type, status, date range, signer, tag, workflow state; filters combine with AND semantics.

**US-22 — Retention & legal hold** — *As a compliance officer, I want automated retention with legal-hold overrides so that we neither hoard nor destroy improperly.*
- AC1: A retention rule (class="signed contracts", keep=10 y, then purge) executes on schedule; purge produces a certified deletion report (doc IDs, hashes, timestamp, approver) sealed by the platform.
- AC2: Legal hold on a matter freezes deletion for all tagged documents regardless of rules; releasing the hold requires Compliance Officer role + reason.
- AC3: Evidence files and audit logs are excluded from document retention rules (their own ≥ 10-year schedule).

**US-23 — Audit log review & export** — *As an auditor, I want to filter and export the audit trail so that I can attest controls.*
- AC1: Filter by actor, event type, resource, date; 100k-row export (CSV/JSON) generates asynchronously and downloads via expiring link within 5 min.
- AC2: Export includes the hash chain; a provided verification script/endpoint re-validates chain integrity end-to-end.
- AC3: Auditor role is read-only everywhere (attempting any mutation returns 403 and is itself audited).

**US-24 — Tenant onboarding & branding** — *As an Owner, I want my org set up with our logo and domain so that recipients trust our requests.*
- AC1: Signup → org creation → first envelope sent achievable in ≤ 15 min (measured in onboarding funnel).
- AC2: Custom email sender domain requires DNS verification (SPF/DKIM/DMARC guidance shown); unverified domains fall back to certidz.com sender with the org name.
- AC3: Branding (logo ≤ 1 MB, colors) applies to signing pages, emails, and the verification portal footer for that tenant's documents.

**US-25 — Roles & permissions administration** — *As an Admin, I want to assign roles so that least-privilege is enforced.*
- AC1: The 6 tenant roles behave exactly per the RBAC matrix (ADMIN-GUIDE §3); an automated permission test suite covers every role × permission cell.
- AC2: Role changes take effect ≤ 60 s across sessions (token refresh/invalidation); downgrades revoke in-flight privileged UI immediately on next request.
- AC3: The last Owner cannot be removed or downgraded; ownership transfer requires the new Owner's acceptance + step-up auth.

**US-26 — Billing with local payment (CIB/EDAHABIA)** — *As an SME founder, I want to pay in DZD with EDAHABIA so that I can actually buy the product.*
- AC1: Checkout in DZD redirects to the SATIM-integrated gateway; on success, the plan activates ≤ 60 s and a compliant invoice (NIF/RC/AI, TVA 19%) is emailed as a sealed PDF.
- AC2: Gateway failure/timeouts leave the account unchanged (idempotent order state machine); the user sees a retriable error, never a double charge (verified by duplicate-callback tests).
- AC3: Bank-transfer flow issues a proforma with a unique reference; an admin reconciliation screen matches incoming transfers and activates plans with full audit.

**US-27 — Usage metering & plan limits** — *As a tenant admin, I want live usage vs. quota so that there are no surprise blocks or bills.*
- AC1: Envelope/IDV/API usage counters update ≤ 5 min after the event; at 80% and 100% of quota, admins are notified.
- AC2: Hard-limit behavior per plan is enforced (Free blocks over-quota sends; paid plans allow metered overage at published rates) and is covered by tests at the boundary (quota, quota+1).
- AC3: Daily reconciliation between event stream and billing aggregates diverges ≤ 0.1%, else an internal alarm fires.

**US-28 — Notifications & reminders** — *As a sender, I want automatic reminders so that I don't chase signers manually.*
- AC1: Default reminder schedule (day 3, 7, then weekly) fires within ±15 min of schedule; per-envelope overrides supported.
- AC2: Emails render correctly RTL in Arabic (verified by visual regression tests) and pass spam checks (SpamAssassin score < 3).
- AC3: A recipient's "resend link" self-service works without sender involvement and invalidates prior links.

**US-29 — PWA offline & mobile signing** — *As a field user, I want to review and pre-sign documents on a patchy connection so that travel doesn't block business.*
- AC1: Previously opened documents are readable offline; attempting to submit a signature offline queues it with a clear "pending sync" state, and it finalizes (with server-side timestamp at sync time, disclosed in the evidence file) once online.
- AC2: If the envelope changed while offline (voided, already signed), the queued action is rejected on sync with a clear conflict message — never silently applied.
- AC3: Lighthouse PWA installability passes; signing flow LCP ≤ 2.5 s on Moto G-class device, Fast 3G.

**US-30 — Public API & webhooks** — *As a developer, I want a sandboxed API so that I embed signing and IDV in my product.*
- AC1: Sandbox and production keys are separate; sandbox never sends real emails/SMS (captured in a viewable outbox) and uses test IDV documents.
- AC2: Webhooks are signed (HMAC-SHA256 with rotating secrets), retried with exponential backoff for 24 h, and replayable from the dashboard; consumer can verify signatures using documented recipes.
- AC3: OpenAPI 3.1 spec is published and CI-validated against the running API (contract tests); breaking changes only in new versions (`/v2`), with 12-month deprecation windows.

---

## 6. Non-functional requirements

### 6.1 Availability & continuity

| NFR | Target |
|---|---|
| SLA (paid plans) | **99.9% monthly uptime** for signing, verification, and API (≤ 43.8 min downtime/month); 99.5% for analytics/AI features. Service credits: 10% (99.0–99.9%), 25% (95–99%), 50% (< 95%). |
| RTO | **≤ 4 hours** (Enterprise/Government: ≤ 1 hour with warm standby). |
| RPO | **≤ 15 minutes** (WAL shipping + continuous S3 replication); evidence files & audit log RPO ≤ 5 minutes. |
| Backups | PostgreSQL PITR 35 days; S3 cross-region replication; quarterly full DR game-day with published results. |
| Verification portal | Must remain read-available even during control-plane incidents (static-friendly architecture, isolated deployment). |

### 6.2 Performance (p95 unless stated)

| Operation | Target |
|---|---|
| API read endpoints | ≤ 200 ms |
| API write endpoints | ≤ 400 ms |
| Signing ceremony first render (20 MB PDF, 4G) | ≤ 3 s |
| Signature application (server-side, incl. TSA) | ≤ 2.5 s |
| Signature verification (portal, 20 MB) | ≤ 5 s |
| Full-text search (1M-doc index) | ≤ 800 ms |
| IDV automated decision after capture | ≤ 30 s |
| Web LCP (dashboard) / (signing page) | ≤ 2.5 s / ≤ 2.5 s on Fast 3G, mid-range Android |
| Throughput floor at GA | 50 envelopes/s created, 20 signatures/s applied, 10 IDV sessions/s — with p95 targets held (see k6 profiles in Testing Strategy) |

### 6.3 Security

- TLS 1.3 (1.2 minimum), HSTS preload; AES-256-GCM at rest; per-tenant envelope encryption with KMS-managed keys; HSM (FIPS 140-2 L3) for signing keys.
- OWASP ASVS Level 2 across the app; Level 3 for signing, key management, and IDV components.
- Secrets in a vault (no secrets in env files in production); quarterly access reviews; SAST/DAST/dependency gates in CI (thresholds in Testing Strategy).
- Complete tenant isolation: row-level security in PostgreSQL + tenant-scoped object prefixes + per-tenant search indices or filtered aliases; enforced by automated cross-tenant tests every build.

### 6.4 Accessibility — WCAG 2.2 AA

- All flows (including the signing ceremony and IDV capture) conform to WCAG 2.2 AA; the signing ceremony is fully operable by keyboard and screen reader (NVDA + VoiceOver tested).
- Contrast ≥ 4.5:1, focus visible, target size ≥ 24×24 px, no time limits without extension on signing pages (envelope expiry excluded).
- Accessibility statement published; audits per release (see Testing Strategy §8).

### 6.5 Internationalization

- Languages: **Arabic (ar-DZ), French (fr-DZ/fr-FR), English (en)**. Arabic is first-class: full RTL layouts (logical CSS properties), RTL emails and PDFs, Arabic-Indic and Western numeral options, Hijri date display option alongside Gregorian.
- All user-generated content, names, and search must handle Arabic script correctly (normalization NFC, diacritic-insensitive search).
- Locale-aware dates (dd/MM/yyyy default), DZD/EUR/USD formatting, Algerian phone formats (+213), Fri–Sat weekend defaults.
- Translation completeness gate: 100% of UI strings for AR/FR/EN before release (CI check); no concatenated-string i18n.

### 6.6 Data & privacy

- Data residency: Algerian tenants' primary data in Algeria; DR replica location contractually disclosed. Government plan: in-country only, on-prem option.
- PII minimization: biometric raw media default retention 90 days (tenant-configurable 1–365 or "delete on decision"); templates and derived scores per retention schedule; deletion produces certified reports.
- Signed documents and evidence: default 10-year retention (Law 15-04 archival alignment), tenant-extendable.

### 6.7 Observability & operations

- OpenTelemetry traces on 100% of API paths (tail-based sampling ≥ 10% baseline, 100% on errors); Prometheus SLO burn-rate alerts (fast: 14.4× over 1 h; slow: 6× over 6 h); Sentry for FE/BE errors with release health.
- Every signature and IDV transaction traceable end-to-end by correlation ID exposed to support tooling (without content access).

---

## 7. Success metrics / KPIs

| Category | KPI | Target (12 mo post-MVP) |
|---|---|---|
| Adoption | Active tenants | 800 (≥ 60 Business+, ≥ 8 Government/Enterprise) |
| Adoption | Envelopes completed / month | 120,000 |
| Activation | Signup → first envelope sent ≤ 24 h | ≥ 45% |
| Engagement | Envelope completion rate | ≥ 82% |
| Speed | Median time-to-all-signed | ≤ 8 h (vs. 9–14 days paper baseline) |
| IDV | Auto-decision rate (no manual review) | ≥ 85% |
| IDV | Fraud pass-through (known-spoof corpus) | ≤ 0.5% |
| Quality | Signature validation failures caused by platform defects | 0 per quarter (Sev-1 class) |
| Reliability | Monthly uptime (signing + verification + API) | ≥ 99.9% |
| Support | CSAT / median first response | ≥ 4.5/5 / ≤ 4 business hours |
| Revenue | MRR / Net Revenue Retention | 25M DZD MRR / NRR ≥ 105% |
| AI | AI suggestion acceptance rate / unsupported-claim rate | ≥ 60% / ≤ 2% |
| Compliance | Audit findings (external) severity ≥ high | 0 open at any release |

Instrumentation: all KPIs must be computable from the analytics warehouse without manual steps; each KPI has an owner and a dashboard at launch.

---

## 8. Out of scope (explicitly)

1. **Acting as a root Certification Authority** for qualified certificates at MVP/V1 — we integrate accredited CSPs first; own accreditation is a National Scale track (see Roadmap).
2. Cryptocurrency payments.
3. Handwriting forensic analysis of wet signatures.
4. General-purpose cloud storage/drive product (we store trust-relevant documents, not a Dropbox replacement).
5. E-voting.
6. Native desktop applications (web + PWA + later mobile apps only).
7. Automatic legal advice — AI outputs are assistive drafts/flags, never legal opinions; no "this contract is legally binding" verdicts from AI.
8. SMS-only signature (link-in-SMS supported; SMS itself is never the signature evidence).
9. Blockchain anchoring (evaluated post-V1 only if a concrete regulatory or customer requirement emerges; hash-chained audit logs cover integrity needs).
10. Offline qualified signing (QSCD operations require online HSM/CSP interaction by design).

---

## 9. Dependencies & assumptions

- **CSP availability:** at least one AECE-accredited CSP exposes an integrable API for qualified certificate issuance/remote signing within V1 timeframe; if not, Qualified level launches via smart-card/token bridge (local signing applet) as fallback.
- **SATIM gateway** contract and sandbox access secured by month 3 for CIB/EDAHABIA integration.
- **TSA:** qualified timestamping available via EU QTSP from day one; Algerian TSA adopted when operational.
- ANPDP registration/notifications completed before processing biometric data in production.
- Elasticsearch licensing (or OpenSearch decision) settled in Phase 0.

## 10. Open questions (tracked in decision log)

1. Own CSP accreditation: pursue in National Scale phase — go/no-go criteria and capital requirements (ADR-014, due M10).
2. Reusable identity wallet (IDV-07) legal basis under Law 18-07 — counsel opinion pending.
3. e-invoicing regulatory timeline in Algeria — affects seal product prioritization.
