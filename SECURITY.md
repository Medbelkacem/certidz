# Security Policy — CertiDZ by HISN

CertiDZ is a digital-trust platform; security is the product. We take vulnerabilities seriously and appreciate coordinated disclosure.

## Supported Versions

| Version | Supported |
|---|---|
| `main` (current) | ✅ |
| Tagged releases within 12 months | ✅ security fixes |
| Older | ❌ |

## Reporting a Vulnerability

Report privately to **security@certidz.dz**. Encrypt sensitive details with our PGP key (fingerprint published at `https://certidz.dz/.well-known/security.txt`).

Please include:

- A description of the issue and its impact.
- Steps to reproduce or a proof of concept.
- Affected component (web, api, PKI, infrastructure) and version/commit.

### Our commitment

- **Acknowledge** within 2 business days.
- **Triage & severity** (CVSS 3.1) within 5 business days.
- **Remediation targets:** Critical ≤ 7 days, High ≤ 30 days, Medium ≤ 90 days.
- We will keep you informed and credit you (with consent) in the advisory.

Please do not access, modify, or exfiltrate other users' data; avoid privacy violations, service degradation, or destruction of data during testing. Testing must stay within accounts and tenants you control.

## Scope Highlights

In scope: the web app, REST/GraphQL API, authentication and session handling, signature/verification pipeline, PKI/certificate services, multi-tenant isolation, and the audit hash-chain. Out of scope: third-party services we integrate with (report to them directly), volumetric DoS, and social engineering of staff.

## Security Design References

- `docs/architecture/SECURITY-ARCHITECTURE.md` — zero-trust design, PKI/HSM, threat model.
- `docs/operations/RUNBOOKS.md` — incident response runbooks.
- `docs/operations/DISASTER-RECOVERY.md` — backup, restore, and continuity.
