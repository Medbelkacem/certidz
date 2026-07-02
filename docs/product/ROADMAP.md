# CertiDZ by HISN — Product Roadmap & Packaging

| | |
|---|---|
| **Version** | 1.2 |
| **Owner** | Product Management, HISN |
| **Last updated** | 2026-07-02 |
| **Horizon** | 24+ months, month 0 = engineering kickoff |

Guiding principle: **trust features ship only when they are provably correct** — a signing feature that is 90% done is 0% shippable. Each phase has hard exit criteria; slipping a criterion slips the phase, not the bar.

---

## Phase 0 — Foundation (Months 0–1)

**Goal:** production-grade skeleton so every later feature lands on rails, not sand.

### Scope
- Monorepo (Next.js frontend, NestJS backend), TypeScript strict mode, shared contracts package (zod/OpenAPI-generated types).
- Multi-tenant data model with PostgreSQL row-level security from day one; Redis (sessions, queues via BullMQ); S3-compatible storage with per-tenant prefixes; Elasticsearch cluster with AR/FR/EN analyzers.
- CI/CD: trunk-based, preview environments per PR, quality gates active from the first merge (see TESTING-STRATEGY §9).
- Kubernetes clusters (staging + production shells) via Terraform; secrets vault; Prometheus/Grafana/OTel/Sentry wired with golden-signal dashboards.
- Security baseline: SSO-ready auth scaffold, Argon2id, audit-log service (hash-chained) as a platform primitive, threat model workshop #1 (STRIDE on signing + IDV flows).
- Design system: shadcn/ui theme, RTL-first layout primitives, i18n framework (ICU messages, AR/FR/EN pipelines), accessibility lint rules.
- Architecture Decision Records started (ADR-001…): HSM/KMS selection, CSP integration strategy, Elasticsearch vs OpenSearch, PDF signing library (with in-house crypto review).

### Exit criteria (all mandatory)
1. "Walking skeleton" deployed to production infra: login → upload PDF → store → retrieve → download, traced end-to-end in Grafana/Tempo.
2. Cross-tenant isolation test suite green (0 leaks) and running on every PR.
3. CI gates enforced: build < 10 min, unit coverage gate active, SAST + dependency scan blocking on critical/high.
4. DR restore rehearsal of the skeleton DB completes with RPO ≤ 15 min / RTO ≤ 4 h demonstrated.
5. HSM/KMS and PDF-signing-library ADRs approved by Security Officer.

### Team (7)
1 PM, 1 Tech Lead/Architect, 2 full-stack, 1 DevOps/SRE, 1 Security engineer (part-time OK), 1 Designer.

### Dependencies
Cloud/data-center contract (DZ region), HSM procurement lead time (order in week 1 — 8–12 week delivery), SATIM sandbox application filed, ANPDP registration initiated.

---

## Phase 1 — MVP (Months 1–4)

**Goal:** a paying SME can send, sign (Simple + Advanced), verify, and pay — legally and reliably.

### Features
- **Auth:** email/password, TOTP + email OTP MFA, WebAuthn/passkeys, sessions & device management, tenant MFA policy (AUTH-01…04, 07).
- **Signature core:** envelopes; sequential + parallel + hybrid routing; field editor; signing ceremony (draw/type/upload); PAdES B-T with RFC 3161 timestamps; evidence file (PDF + JSON); decline/reassign; reminders & expiry; void (SIG-01a/b, 02 partial, 04–07, 12, 13).
- **Verification portal:** public QR + upload validation, AR/FR/EN (SIG-08).
- **Documents:** upload/AV-scan, folders/tags, full-text search, org + personal templates, sharing links (DOC-01, 02, 05, 07).
- **Identity (v1):** document OCR (CNIBE, passport) + face match + passive liveness; sessions API + webhooks; manual review console (IDV-01, 02, 03 partial, 05, 06).
- **Admin:** org/teams, 6-role RBAC, tenant policies, audit log + export, branding + custom sender domain (ADM-01…04; US-24, 25).
- **Billing:** Free/Pro/Business plans; Stripe + bank-transfer/proforma flow; DZD/EUR invoices with fiscal mentions; usage metering (BIL-01, 02 partial, 03, 05).
- **Notifications:** localized transactional email (RTL-correct) + in-app (NOT-01 partial, 03).
- **Basic analytics:** tenant dashboard (ANA-01), internal product analytics (ANA-05).
- **Mobile:** fully responsive signing (MOB-02).
- **API (private beta):** envelope creation + webhooks for 5 design partners (SIG-11 subset).

### Exit criteria
1. 10 design-partner tenants complete ≥ 200 real envelopes total; envelope completion rate ≥ 75%.
2. Signature validity: 100% of a 500-envelope production sample validates in Adobe Acrobat and the ETSI-based test harness; 0 open Sev-1/Sev-2 signature defects.
3. External penetration test passed: 0 critical/high findings open at launch.
4. NFRs measured in production: API p95 ≤ 200/400 ms (read/write), signing-page LCP ≤ 2.5 s (Fast 3G lab), uptime ≥ 99.5% over the last 30 days of the phase.
5. First 5 paying tenants (real invoices, ≥ 1 via bank transfer in DZD).
6. WCAG 2.2 AA audit of signing ceremony + auth flows: 0 blocker/critical issues.
7. IDV spoof-corpus rejection ≥ 96% (interim bar; 98% by V1).

### Team (12)
1 PM, 1 Tech Lead, 3 full-stack, 1 crypto/signature specialist, 1 ML/IDV engineer, 1 DevOps/SRE, 1 QA (automation-first), 1 Security, 1 Designer, 1 Support/Success (part-time → full at launch).

### Dependencies
TSA (QTSP) contract live; SATIM sandbox granted (integration lands in V1 but contract must exist now); HSM installed and key ceremony #1 performed; legal review of consent texts and evidence file by Algerian counsel.

---

## Phase 2 — V1 Growth (Months 5–9)

**Goal:** the platform banks, universities, and integrators can adopt: qualified signatures, local payments, public API, AI assist, workflows.

### Features
- **Qualified signatures:** accredited-CSP integration (issuance + remote signing or token bridge), PAdES B-LT/B-LTA, LTV re-timestamping service, XAdES/CAdES, ASiC-E (SIG-01c, 02 full, 03; US-05, 07).
- **Digital seals:** organizational seals; bulk seal (diplomas, invoices) with batch console (SIG-09, 10; US-18).
- **Payments:** CIB/EDAHABIA via SATIM in production; PayPal; dunning & grace flows (BIL-02 full, 04; US-26).
- **Public API GA + developer portal:** OpenAPI 3.1, sandbox, signed webhooks, SDKs (TypeScript, PHP, Python), rate limits per plan (US-30).
- **IDV v2:** active liveness step-up; NFC eMRTD reading (Android app/WebNFC); fraud-signal assist; PAD Level 2 evidence pack (IDV-03 full, 04; AI-07).
- **AI Assistant v1:** document classification, OCR searchable-PDF, contract clause extraction + risk flags, doc Q&A with citations, smart field placement — all under AI-05 guardrails (AI-01…06).
- **Workflow automation v1:** visual builder, approvals, conditional routing, SLA/escalation, execution logs, 6 template gallery entries (WF-01…05).
- **Collaboration:** comments/@mentions, teams/spaces, guest access (COL-01, 03, 04).
- **Analytics v2:** funnels, scheduled reports, compliance reports (ANA-02, 03, 04).
- **SSO:** SAML/OIDC for Business+ (AUTH-05).
- **PWA:** installable, offline reading, queued actions, low-bandwidth mode (MOB-01, 04; US-29).
- **Compliance:** GDPR/Law 18-07 rights tooling; retention & legal hold (CMP-02; DOC-06; US-22).

### Exit criteria
1. ≥ 3 tenants signing with **Qualified** level in production; qualified signatures validate against ETSI conformance suite with 0 failures.
2. ≥ 25% of new self-serve revenue collected via CIB/EDAHABIA (proves local rail works).
3. API: ≥ 15 external integrations live; webhook delivery success ≥ 99.5% within 5 min.
4. IDV: auto-decision ≥ 80%, spoof rejection ≥ 98% on the expanded corpus, NFC verification demonstrated on top-10 Android devices in DZ market.
5. AI: unsupported-claim rate ≤ 2% on golden sets; AI features enabled for ≥ 40% of active tenants with acceptance rate ≥ 50%.
6. Scale test passed: 50 envelopes/s created, 20 signatures/s applied for 1 h sustained with p95 targets held (k6 profile V1-LOAD-01).
7. Uptime ≥ 99.9% over the final 90 days of the phase; MRR ≥ 8M DZD; ≥ 250 active tenants.
8. ISO 27001 Stage 1 audit scheduled with gap assessment closed ≥ 80%.

### Team (20)
1 GPM + 1 PM, 1 EM, 5 full-stack, 2 signature/PKI, 2 ML/AI, 1 mobile, 2 DevOps/SRE, 2 QA, 1 Security, 1 Designer, 2 Support/Success, 1 Solutions engineer (partial: Sales-supporting).

### Dependencies
AECE-accredited CSP contract signed (month 4 at latest — **critical path** for Qualified); SATIM production approval; ANPDP biometric processing clearance; CSCA master-list source for NFC passive authentication.

---

## Phase 3 — Enterprise Edition (Months 10–18)

**Goal:** win banks, insurers, and ministries: deployment flexibility, deep control, certification.

### Features
- **Enterprise deployment:** single-tenant SaaS, private-cloud, and on-prem Kubernetes (Helm/Terraform packages, air-gap-capable installer, offline license mechanism); white-label option.
- **Enterprise IAM:** SCIM provisioning, custom roles from permission catalog, IP allowlists, session policies, delegated admin scopes (AUTH-06, 08; ADM-02 custom roles).
- **Compliance & certification:** ISO/IEC 27001 certification achieved; SOC 2 Type I initiated; eIDAS-readiness validation (ETSI test suites, EU Trusted List consumption) (CMP-03, 04).
- **Advanced workflows:** public intake forms with IDV step, cross-department routing, workflow API, versioned workflow deployments (WF-06).
- **Reusable verified identity ("CertiDZ ID")** pilot under counsel-approved consent framework (IDV-07).
- **Native mobile app:** NFC-first identity + passkey signing authorization (MOB-03).
- **Data & integrations:** connectors (SharePoint, Google Drive, ERP/HR systems), SFTP batch intake, data warehouse export (Parquet to tenant S3).
- **Ops for scale:** multi-region active/warm DR, tenant-level rate isolation, per-tenant encryption key rotation self-service, 99.9% SLA with credits formally offered; 1 h RTO for Enterprise tier.
- **Advanced analytics:** tenant health scores, anomaly alerts (unusual signing patterns → security signal).

### Exit criteria
1. ≥ 2 on-prem/private-cloud production deployments (≥ 1 government) installed by the packaged installer in ≤ 5 working days each.
2. ISO 27001 certificate issued; 0 major nonconformities.
3. ≥ 5 Enterprise contracts (ACV ≥ 6M DZD each) and ≥ 2 Government contracts signed.
4. DR: multi-region failover game-day meets RTO ≤ 1 h / RPO ≤ 5 min for Enterprise tier, evidenced.
5. Scale test: 150 envelopes/s created, 60 signatures/s, 30 IDV/s sustained 2 h (k6 profile ENT-LOAD-01), p95 held.
6. SCIM + SSO certified against Entra ID and Keycloak reference setups (automated conformance suite).
7. NRR ≥ 105%; MRR ≥ 25M DZD; ≥ 800 active tenants.

### Team (32)
2 PM + 1 GPM, 2 EM, 8 full-stack, 3 signature/PKI, 3 ML/AI, 2 mobile, 3 DevOps/SRE (incl. 1 on-prem specialist), 3 QA, 2 Security/GRC, 1 Designer, 3 Success/Support, + Sales/Solutions org (outside this count).

### Dependencies
ISO 27001 external auditor engaged by month 10; government procurement framework agreements; hardware partner for on-prem HSM installs.

---

## Phase 4 — National Scale & African Expansion (Months 18+)

**Goal:** become national trust infrastructure and replicate the playbook regionally.

### Tracks
1. **CSP accreditation track (go/no-go at M18):** pursue accreditation as a Certification Service Provider under the AECE/ARPCE economic branch — own qualified certificate issuance, in-house QSCD/HSM signing service, audited key ceremonies, CP/CPS publication. Structured as a separate compliance program (12–18 months, dedicated GRC + PKI team of 5).
2. **National integrations:** interconnection with government identity rails as they open (national ID verification services, interoperability with AGCE-sealed documents), e-invoicing readiness, sectoral schemes (notarial chamber, bar associations, university networks).
3. **African expansion wave 1:** Tunisia (TunTrust ecosystem), Senegal, Côte d'Ivoire — per-country trust-framework adapters (local CA chains, local ID document templates, local payment rails: Flouci/mobile money/Orange Money/Wave), French-first localization already covered; add country compliance packs.
4. **Platform maturity:** SOC 2 Type II; bug bounty program public; 99.95% SLA tier; volume pricing for 100M+ annual transactions; marketplace for workflow templates and partner integrations.

### Exit criteria (rolling, reviewed quarterly)
- ≥ 1M signature transactions/year run-rate; ≥ 500K IDV/year.
- 2 non-Algerian markets each ≥ 50 paying tenants within 9 months of country launch.
- If CSP track green-lit: accreditation dossier filed and pilot qualified issuance under supervision.
- Platform gross margin ≥ 70%; support cost per envelope declining quarter-over-quarter.

### Team
45–60 total product/engineering; country pods (PM + 2 eng + 1 compliance) per new market.

---

## Cross-phase risk register (top 5)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Accredited-CSP integration slips (blocks Qualified) | Medium | High | Dual-track: remote CSP API **and** smart-card/token bridge; contract by M4; Advanced-level GTM does not depend on it |
| SATIM/CIB certification delays | Medium | High | Start paperwork in Phase 0; bank-transfer flow is a full fallback; Stripe for non-DZD |
| HSM procurement lead time | Medium | Medium | Order week 1; cloud-HSM interim for staging only (never for qualified keys) |
| Biometric processing clearance (ANPDP) delays IDV | Low–Med | High | Early registration; launch IDV with design partners under explicit-consent framework; counsel on retainer |
| Talent scarcity (PKI, ML) in local market | High | Medium | Hybrid remote hiring, training budget, partnership with universities (also a GTM channel) |

---

## Pricing & packaging

Currency: primary DZD (SATIM/CIB/EDAHABIA, bank transfer), EUR via Stripe/PayPal for international. Prices are indicative launch prices, VAT (19% TVA) exclusive; annual billing = 2 months free.

### Plans

| | **Free** | **Pro** | **Business** | **Enterprise** | **Government** |
|---|---|---|---|---|---|
| **Price / user / month** | 0 | **2,900 DZD / €18** | **6,900 DZD / €42** | from **12,500 DZD / €75** (annual, min 25 seats) | Custom (tender-compatible; per-transaction or site license) |
| **Target** | Individuals, trial | Freelancers, micro-SME | SMEs, teams, universities' departments | Banks, insurers, large corporates | Ministries, wilayas, municipalities, public universities/hospitals |
| Envelopes included /user/mo | 3 | 25 | 100 | Custom pool | Custom pool |
| Extra envelope | — (blocked) | 90 DZD | 60 DZD | Volume tiers from 35 DZD | Volume tiers |
| Signature levels | Simple | Simple + Advanced | Simple + Advanced | + Qualified, Seals, Bulk | + Qualified, Seals, Bulk |
| Identity verification (IDV) | — | Add-on 250 DZD/check | 10 incl./mo/user, then 200 DZD | Volume from 120 DZD | Volume; on-prem engine option |
| NFC chip verification | — | — | Add-on | ✔ | ✔ |
| AI Assistant | — | 50 credits/mo | 300 credits/mo | Custom / opt-out | Sovereign-mode (in-tenant inference) |
| Workflows | — | 3 active | 25 active | Unlimited | Unlimited |
| Templates | 1 | 10 | Unlimited | Unlimited | Unlimited |
| Teams & RBAC (6 roles) | — | Basic (no custom) | ✔ | ✔ + custom roles + SCIM | ✔ + custom roles + SCIM |
| SSO (SAML/OIDC) | — | — | ✔ | ✔ | ✔ |
| API access | — | Sandbox only | 10K calls/mo | Custom + higher rate limits | Custom |
| Branding / custom sender domain | — | Logo only | ✔ | ✔ + white-label | ✔ + white-label |
| Audit log retention | 90 days | 1 year | 5 years | 10+ years, export streams | 10+ years, export streams |
| Data residency (DZ) | ✔ (shared) | ✔ | ✔ | ✔ + single-tenant / private cloud | In-country / on-prem / air-gap |
| Support | Community | Email (NBD) | Email+chat, 8×5, 4 h P1 | 24/7, 1 h P1, TAM | 24/7, 1 h P1, TAM, on-site option |
| SLA | — | 99.5% | 99.9% | 99.9% (99.95% option) + credits | Contractual, up to 99.95% |
| Onboarding | Self-serve | Self-serve | Guided webinar | Dedicated onboarding + training | Dedicated + certification training |

### Metered add-ons (all paid plans)
- IDV check: per table above; active-liveness step-up +50 DZD; NFC read +80 DZD.
- Qualified signature transaction: 350 DZD (CSP cost pass-through included) — Enterprise/Government volume tiers from 220 DZD.
- Qualified timestamp (standalone): 20 DZD.
- AI credits: 1,500 DZD per 500 credits (1 credit ≈ 1 doc classification or Q&A; contract review = 5 credits).
- SMS notifications: 8 DZD/SMS (DZ), pass-through elsewhere.

### Packaging rules
- Free never expires but is hard-capped (3 envelopes/mo, Simple only) — designed to feed the verification portal's network effect (every signed doc advertises verification).
- Downgrade-not-delete: lapsed accounts keep read + verify access forever; sending is blocked.
- Government pricing supports per-transaction procurement (no per-seat requirement) to fit public tender structures.
- Partner/reseller margin: 20% year 1, 15% renewals (integrators, MSPs, notarial software vendors).
