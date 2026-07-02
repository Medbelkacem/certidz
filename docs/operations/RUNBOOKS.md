# CertiDZ by HISN — Operational Runbooks

> **Document class:** Internal — Restricted (Operational On-Call Reference)
> **Owner:** SRE On-Call / Platform Reliability
> **Version:** 1.0 — 2026-07-02
> **Review cadence:** Quarterly and after any incident whose runbook proved incomplete (runbook-drift is a tracked finding)
> **Applies to:** Production namespace `certidz`, data namespace `data`, observability namespace `observability`; primary DZ + DR EU regions
> **Companion:** [`DISASTER-RECOVERY.md`](./DISASTER-RECOVERY.md) — regional failover, backup matrix, severity matrix (authoritative), comms plan. Severities below are the SAME scale.

---

## How to use this document

Each runbook is a self-contained response to one class of incident and follows a fixed structure so an on-call engineer can act under pressure without reading prose:

1. **Detection signals** — the exact alerts (from `infra/monitoring/prometheus/alerts.yml`), metrics, and logs that indicate this incident.
2. **Impact / severity** — user-facing impact and the [DR severity](./DISASTER-RECOVERY.md#7-incident-severity-matrix) it maps to.
3. **Immediate triage** — the first 2–5 minutes: confirm, scope, stop the bleeding.
4. **Step-by-step remediation** — real commands (`kubectl`, `psql`, `redis-cli`, BullMQ/bull-board, `wal-g`, `dig`).
5. **Escalation path** — who to page and when.
6. **Post-incident actions** — cleanup, verification, and follow-ups.

### Alert → runbook linkage

Prometheus rules in `infra/monitoring/prometheus/alerts.yml` carry a `runbook_url` annotation pointing at the anchor below, and a `severity` label mapping to the DR matrix. Alertmanager routes by `severity` to PagerDuty/Opsgenie. When an alert fires, follow its `runbook_url` here.

| Alert (alerts.yml) | Runbook | Default severity |
|---|---|---|
| `TargetDown`, `ApiHighErrorRate` (5xx), `ApiPodsNotReady` | [#1 API down](#runbook-1--api-down) | SEV2 |
| `PostgresPrimaryDown`, `PostgresReplicationLag` | [#2 Postgres failover](#runbook-2--postgres-failover) | SEV2 |
| `SignatureQueueBacklog`, `QueueDlqGrowing`, `WorkerStalled` | [#3 Queue backlog](#runbook-3--queue-backlog) | SEV3 |
| `CertificateExpiringSoon`, `PlatformTlsExpiry` | [#4 Certificate/TLS expiry](#runbook-4--certificatetls-expiry) | SEV3 → SEV2 |
| `HsmUnreachable`, `SigningDegraded`, `TsaDegraded` | [#5 HSM unreachable](#runbook-5--hsm-unreachable) | SEV2 → SEV1 |
| `S3EndpointDown`, `ObjectStoreErrors` | [#6 S3/object-store outage](#runbook-6--s3object-store-outage) | SEV2 |
| `AuthBruteForce` (SIEM `AUTH-BRUTE-01`), `Elevated401Rate` | [#7 Credential-stuffing](#runbook-7--credential-stuffing--elevated-401s) | SEV3 |
| _(manual: tenant support request)_ | [#8 Customer data-restore request](#runbook-8--customer-data-restore-request) | SEV3 |

**Global preamble (every runbook):**

```bash
kubectl config use-context dz-primary            # or eu-dr during/after failover
export NS=certidz                                # app namespace
export DATA=data                                 # stateful namespace
# JIT production access must be active (ticket-bound, session-recorded).
```

---

## Runbook 1 — API down

5xx spike, `TargetDown`, or pods not ready; `GET /api/v1/health` failing.

### Detection signals
- **Alerts:** `TargetDown{job="certidz-api"}`, `ApiHighErrorRate` (5xx ratio > 2% for 5 min), `ApiPodsNotReady`.
- **Metrics** (`GET /api/v1/metrics`): `http_requests_total{status=~"5.."}` rising; `http_request_duration_seconds` p95 > 500 ms (SLO breach); readiness gauge low.
- **Logs:** `kubectl -n $NS logs deploy/certidz-api` showing crashloop, unhandled exceptions, DB/Redis connection errors, or OOMKill events.
- **Synthetic:** external probe on `https://app.certidz.dz/api/v1/health` failing.

### Impact / severity
Core API unavailable or erroring → signing, verification, uploads impacted. **SEV2** (SEV1 if platform-wide and error budget of 43.8 min/month is being consumed fast).

### Immediate triage
```bash
kubectl -n $NS get deploy,po -l app=certidz-api -o wide
kubectl -n $NS rollout status deploy/certidz-api
kubectl -n $NS get events --sort-by=.lastTimestamp | tail -30
curl -sf https://app.certidz.dz/api/v1/health | jq . || echo "health FAILED"
```
Determine the class: (a) bad deploy, (b) dependency down (Postgres/Redis/S3), (c) resource exhaustion (OOM/CPU), (d) infra/node.

### Step-by-step remediation
```bash
# (a) Bad deploy → roll back to last-known-good digest.
kubectl -n $NS rollout history deploy/certidz-api
kubectl -n $NS rollout undo deploy/certidz-api            # or --to-revision=<n>
kubectl -n $NS rollout status deploy/certidz-api --timeout=180s

# Confirm image is a pinned digest (never :latest in prod).
kubectl -n $NS get deploy certidz-api -o jsonpath='{.spec.template.spec.containers[*].image}'; echo

# (b) Dependency down → jump to the relevant runbook.
#     Postgres → Runbook 2; Redis → check below; S3 → Runbook 6; HSM → Runbook 5.
kubectl -n $NS exec deploy/certidz-api -- sh -c 'nc -z postgres.data.svc.cluster.local 5432 && echo pg-ok'
kubectl -n $NS exec deploy/certidz-api -- sh -c 'nc -z redis.data.svc.cluster.local 6379 && echo redis-ok'

# (c) Resource exhaustion → inspect and scale.
kubectl -n $NS top po -l app=certidz-api
kubectl -n $NS describe po -l app=certidz-api | grep -A3 -iE 'OOMKilled|Last State|Reason'
kubectl -n $NS scale deploy/certidz-api --replicas=8          # HPA may already be maxed; raise ceiling if needed
kubectl -n $NS get hpa

# (d) initContainer migrate failing (blocks startup) → check the migration.
kubectl -n $NS logs deploy/certidz-api -c migrate | tail -40
#   If prisma migrate deploy failed, this is often a bad migration — coordinate a fix/rollback with the DB owner.

# (e) Node-level → cordon/drain the bad node and let pods reschedule.
kubectl get nodes; kubectl -n $NS get po -o wide | grep certidz-api
kubectl cordon <node>; kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
```

### Escalation path
On-call SRE → (if dependency) DBA / PKI / Storage on-call → IC if not mitigated in **15 min** or if platform-wide (declare SEV2, open status page). CISO if a security cause is suspected.

### Post-incident actions
- Confirm health green and p95 < 500 ms for 15 min.
- If a bad deploy: freeze that release, add a regression test/canary gate.
- File post-incident review (blameless, ≤ 5 business days). Update `alerts.yml` thresholds if the alert fired late or noisily.

---

## Runbook 2 — Postgres failover

Primary Postgres down; Patroni promote; replication lag.

### Detection signals
- **Alerts:** `PostgresPrimaryDown`, `PostgresReplicationLag` (replica lag > 15 min / > 5 min for Ent-Gov clusters).
- **Metrics:** `pg_up == 0` on primary; `pg_replication_lag_seconds` high; connection errors from API (Runbook 1 may fire simultaneously).
- **Logs:** Patroni logs, `kubectl -n $DATA logs sts/postgres-ha-0`.

### Impact / severity
Writes fail platform-wide; reads may continue on replica. **SEV2** (escalates toward the [DR full-failover procedure](./DISASTER-RECOVERY.md#32-full-regional-failover) if the whole region is affected).

### Immediate triage
```bash
kubectl -n $DATA exec sts/postgres-ha-0 -- patronictl -c /etc/patroni/patroni.yml list
#   Shows roles (Leader/Replica), state, and lag per member.
psql -h postgres.data.svc.cluster.local -U postgres -c "SELECT pg_is_in_recovery();"
```
If Patroni shows no Leader and a healthy replica exists, an automatic failover should be in progress — verify, do not fight it.

### Step-by-step remediation
```bash
# 1. Let Patroni auto-failover; confirm a new Leader was elected.
kubectl -n $DATA exec sts/postgres-ha-0 -- patronictl -c /etc/patroni/patroni.yml list
#   Expect one member = Leader, running, lag 0.

# 2. If no automatic promotion (e.g., quorum issue), promote a healthy replica manually.
kubectl -n $DATA exec sts/postgres-ha-0 -- patronictl -c /etc/patroni/patroni.yml \
  failover --candidate postgres-ha-1 --force

# 3. Verify the new primary accepts writes and check replication gap vs RPO.
psql -h postgres.data.svc.cluster.local -U postgres -c "SELECT pg_is_in_recovery();"   # expect f
psql -h postgres.data.svc.cluster.local -U postgres -c \
  "SELECT client_addr, state, write_lag, replay_lag FROM pg_stat_replication;"
psql -h postgres.data.svc.cluster.local -U postgres -c \
  "SELECT now() - pg_last_xact_replay_timestamp() AS lag;"    # must be within tier RPO

# 4. PgBouncer picks up the new primary via the service; bounce app connections if stale.
kubectl -n $NS rollout restart deploy/certidz-api

# 5. Verify audit-chain integrity after any promotion (evidence-over-trust).
psql -h postgres.data.svc.cluster.local -U postgres -d certidz -c "SELECT verify_chain();"

# 6. Rebuild the old primary as a fresh replica once it returns (avoid split-brain).
#    Patroni reinit the demoted node:
kubectl -n $DATA exec sts/postgres-ha-0 -- patronictl -c /etc/patroni/patroni.yml reinit certidz-ha postgres-ha-0

# 7. If NO healthy replica exists (data loss risk) → do NOT force; escalate to DBA + consider
#    PITR restore (DISASTER-RECOVERY.md §3.1) or full regional failover (§3.2).
```

### Escalation path
SRE on-call → **DBA on-call immediately** on any manual promotion or lag > RPO. IC + CTO/CISO if PITR restore or regional failover is required (that is a DR event; see [DISASTER-RECOVERY.md](./DISASTER-RECOVERY.md)).

### Post-incident actions
- Record measured replication gap at promotion (RPO evidence).
- Confirm `verify_chain()` passes; confirm nightly restore verification is green.
- Rebuild/re-add the demoted node as replica; confirm HA restored (2+ healthy members).
- Review whether `PostgresReplicationLag` threshold gave enough lead time.

---

## Runbook 3 — Queue backlog

`SignatureQueueBacklog`, BullMQ `sign`/`ai` depth, DLQ growth, stalled workers.

### Detection signals
- **Alerts:** `SignatureQueueBacklog` (`sign` waiting > 500 or oldest job age > 5 min), `QueueDlqGrowing` (`*:dlq` count rising), `WorkerStalled`.
- **Metrics:** BullMQ exporter gauges for `waiting`, `active`, `delayed`, `failed` per queue (`sign`, `pdf`, `ai`, `notify-email`, `notify-sms`, `webhook`, `index`, `pki`, `billing`, `events:*`).
- **Logs / UI:** bull-board dashboard; worker logs showing stalls or repeated failures.
- **Symptom:** signature completion > 30 s SLO; users report "signing stuck / processing".

### Impact / severity
Delayed signing/AI/notifications; not data loss (jobs are durable in Redis + outbox). **SEV3** (SEV2 if `sign` backlog breaches signing SLO broadly or DLQ indicates systematic failure).

### Immediate triage
```bash
# Queue depths at a glance (BullMQ helper) — or open bull-board.
kubectl -n $NS exec deploy/certidz-worker -- node dist/ops/queue-stats.js all
#   sign: waiting=812 active=10 delayed=3 failed=44  <-- backlog + failures
kubectl -n $NS port-forward deploy/certidz-worker 3030:3030   # bull-board at http://localhost:3030

# Are workers alive and consuming?
kubectl -n $NS get deploy -l role=worker
kubectl -n $NS logs deploy/certidz-worker --since=5m | grep -iE 'stalled|error|failed|reconnect'

# Redis health (queue backend).
redis-cli -h redis.data.svc.cluster.local -p 6379 INFO clients | grep connected_clients
redis-cli -h redis.data.svc.cluster.local -p 6379 LLEN bull:sign:wait
```

### Step-by-step remediation
```bash
# 1. Distinguish the two cases: (A) not enough consumers, (B) poison jobs failing repeatedly.

# (A) Throughput problem → scale workers (HPA may key off queue depth).
kubectl -n $NS scale deploy/certidz-worker --replicas=8
kubectl -n $NS get hpa certidz-worker 2>/dev/null

# Stalled/stuck workers → restart to clear stalled locks (BullMQ recovers 'active' stalled jobs).
kubectl -n $NS rollout restart deploy/certidz-worker
kubectl -n $NS rollout status deploy/certidz-worker

# (B) Poison jobs → inspect the DLQ, find the failing reason, decide retry vs drop.
kubectl -n $NS exec deploy/certidz-worker -- node dist/ops/queue-inspect.js sign:dlq --limit 10
#   Look for a common failedReason (e.g., HSM unreachable -> Runbook 5; S3 error -> Runbook 6).

# If root cause is fixed, replay the DLQ back onto the main queue.
kubectl -n $NS exec deploy/certidz-worker -- node dist/ops/dlq-replay.js sign --limit 500

# If jobs are genuinely bad (malformed), drain with an audit record (do not silently delete).
kubectl -n $NS exec deploy/certidz-worker -- node dist/ops/dlq-drain.js sign --reason 'malformed payload' --record

# 2. If backlog is downstream of a dependency, resolve that first:
#    sign/pki backlog + HSM errors      -> Runbook 5 (HSM)
#    pdf/index backlog + S3 errors      -> Runbook 6 (S3)
#    ai backlog + model-gateway timeouts-> check AI_GATEWAY, per-tenant token budgets

# 3. Confirm drain.
watch -n5 "kubectl -n $NS exec deploy/certidz-worker -- node dist/ops/queue-stats.js sign"
```

### Escalation path
SRE on-call → owning service team if a poison-job pattern points at a code bug → Runbook 5/6 owners if dependency-driven. Escalate to SEV2 + IC if signing SLO is broadly breached.

### Post-incident actions
- Confirm all queues drained and DLQs stable (not growing).
- Root-cause poison jobs; add validation or a retry/backoff policy.
- Verify outbox relay + `consumer_inbox` dedupe prevented duplicate side-effects.
- Tune `SignatureQueueBacklog` threshold and worker HPA if response was late.

---

## Runbook 4 — Certificate / TLS expiry

Platform TLS cert, ingress cert, or internal mesh cert expiring/expired.

### Detection signals
- **Alerts:** `CertificateExpiringSoon` (< 14 d), `PlatformTlsExpiry` (< 7 d = escalate), cert-manager `CertificateNotReady`.
- **Metrics:** `certmanager_certificate_expiration_timestamp_seconds` approaching now; `probe_ssl_earliest_cert_expiry` (blackbox) low.
- **Symptom:** TLS handshake failures on `app.certidz.dz`/`tsa`/`ocsp`/`crl`; mTLS mesh call failures; browser cert warnings.

> **Note:** This runbook covers **transport/TLS** certs (ingress + mesh). **End-entity signing certificates** and **CA/CRL/OCSP** are PKI concerns — see [DISASTER-RECOVERY.md §6](./DISASTER-RECOVERY.md#6-evidence-vault-immutability--pki-key-considerations) and escalate to PKI on-call.

### Impact / severity
Expired public TLS → total inability to reach the platform (**SEV2/SEV1**). Expired mesh cert → east-west call failures. Expiring-soon (not yet expired) → **SEV3**, fix before it bites.

### Immediate triage
```bash
# Which cert, and how long left?
echo | openssl s_client -servername app.certidz.dz -connect app.certidz.dz:443 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
kubectl -n $NS get certificate,certificaterequest -o wide
kubectl -n $NS describe certificate <name> | grep -A5 -iE 'status|renew|message'
```

### Step-by-step remediation
```bash
# (Ingress / edge TLS via cert-manager) — force renewal.
kubectl -n $NS get certificate                       # find Ready=False or near expiry
kubectl cert-manager renew <cert-name> -n $NS        # cmctl; or annotate to retrigger:
kubectl -n $NS annotate certificate <cert-name> cert-manager.io/issue-temporary-certificate="true" --overwrite
kubectl -n $NS delete certificaterequest <stuck-cr>  # clear a stuck request to force re-issue
kubectl -n $NS describe order,challenge 2>/dev/null | tail -40   # ACME challenge state (edge)

# Verify the ingress picked up the new secret.
kubectl -n $NS get secret <tls-secret> -o jsonpath='{.data.tls\.crt}' | base64 -d \
  | openssl x509 -noout -enddate

# (Internal mesh — SPIRE/cert-manager infra ICA) — SVIDs auto-rotate (1h TTL, renew at 30m).
#   A stuck workload: restart to force re-attestation.
kubectl -n $NS rollout restart deploy/<mesh-workload>
#   Infra service certs (Postgres/Redis/ES) via ClusterIssuer:
kubectl get clusterissuer; kubectl -n $DATA get certificate

# Emergency: if automated issuance is broken and public TLS is expiring, install a
# temporary valid cert into the ingress secret under CISO awareness, then fix issuance.
```

### Escalation path
SRE on-call → **PKI on-call** for any CA/mesh-ICA issue → IC + CISO if public TLS is expired or expiry is imminent with issuance broken (SEV2/SEV1).

### Post-incident actions
- Confirm auto-renewal restored (cert Ready, next renewal scheduled at 2/3 lifetime).
- Fix the root cause of the renewal failure (ACME rate-limit, DNS-01 misconfig, ICA reachability).
- Ensure `CertificateExpiringSoon` fires with ≥ 14 d lead; add lower-threshold page for public TLS.

---

## Runbook 5 — HSM unreachable

Signing degraded — fail-closed; TSA degraded mode; HSM signing service down.

### Detection signals
- **Alerts:** `HsmUnreachable`, `SigningDegraded`, `TsaDegraded`.
- **Metrics:** HSM signing service health failing; `hsm_sign_errors_total` rising; session-pool health (`C_GetSessionInfo`) failing; `sign` + `pki` queues backing up (Runbook 3 fires).
- **Logs:** `hsm-signing-svc` PKCS#11 errors (`CKR_DEVICE_ERROR`, `CKR_TOKEN_NOT_PRESENT`, login failures), circuit-breaker open.

### Impact / severity
Signing (advanced/qualified), seals, TSA timestamps, and cert issuance blocked. Production **fails closed — there is no software signing fallback** (by design; security doc §5.3). **SEV2**; **SEV1 if a key-compromise is suspected** or if the HSM is unrecoverable and DR HSM activation is required.

### Immediate triage
```bash
kubectl -n $NS get deploy hsm-signing-svc -o wide
kubectl -n $NS logs deploy/hsm-signing-svc --since=10m | grep -iE 'CKR_|pkcs11|login|circuit|session'
# Is it the service, the network path, or the appliance?
kubectl -n $NS exec deploy/hsm-signing-svc -- sh -c 'nc -z -w3 <hsm-vlan-ip> 1792 && echo hsm-tcp-ok'
kubectl -n $NS exec deploy/hsm-signing-svc -- hsm-cli session-info    # pool health
```
Confirm whether signing is **fail-closed** (expected safe state) vs. producing bad output (never should — fail-closed prevents it).

### Step-by-step remediation
```bash
# 1. Service-level recovery — restart to rebuild PKCS#11 session pool + re-login.
kubectl -n $NS rollout restart deploy/hsm-signing-svc
kubectl -n $NS rollout status deploy/hsm-signing-svc
kubectl -n $NS logs deploy/hsm-signing-svc --since=2m | grep -iE 'login ok|pool ready|partition'

# 2. Verify PIN delivery (Vault response-wrapped at pod start) — a PIN fetch failure blocks login.
kubectl -n $NS describe po -l app=hsm-signing-svc | grep -A3 -iE 'vault|secret|init'

# 3. Confirm partitions are active and keys available with a NON-PROD test-sign.
kubectl -n $NS exec deploy/hsm-signing-svc -- \
  hsm-cli test-sign --key-label 'certidz/tsa/tsa-signing/v3' --digest-sha256 <known-test-digest>
#   Success => keys reachable, safe to resume. Failure => appliance/HA problem (step 4).

# 4. Appliance/HA fault (both HA members bad, VLAN down):
#    - Confirm the network HSM cluster HA state with the HSM admin tooling / vendor console.
#    - If the primary HSM cluster is unrecoverable, activate the DR HSM replica pair
#      (cloned domain; root EXCLUDED) — this is a DR event:
#      see DISASTER-RECOVERY.md §3.2 step 5 and §6.3/§6.4.

# 5. TSA degraded mode: while signing is down, TSA queues timestamp requests and applies
#    late timestamps within policy limits once restored — DO NOT bypass or emit untrusted tokens.
#    Verify degraded-mode queue is bounded:
kubectl -n $NS exec deploy/certidz-worker -- node dist/ops/queue-stats.js sign pki

# 6. On restore, drain the backed-up sign/pki queues (Runbook 3), then verify a canary envelope
#    completes end-to-end (sign -> timestamp -> seal -> verify).
scripts/dr/canary-envelope.sh --tenant canary --wait 60
```

> **⚠️ Never** enable any software-signing fallback in production. Fail-closed is the correct, compliant behavior; degraded availability is preferable to an untrusted signature.

### Escalation path
SRE on-call → **PKI/HSM on-call immediately** → CISO. **Declare SEV1** if key-compromise is suspected (invoke CPS compromise procedure, [DISASTER-RECOVERY.md §6.4](./DISASTER-RECOVERY.md#64-if-the-hsm-is-lost-re-key-ceremony)) or if DR HSM activation is needed.

### Post-incident actions
- Verify test-sign + canary envelope pass; drain queues; confirm no timestamps were emitted outside policy.
- Confirm the nightly HSM attribute-audit job (`CKA_EXTRACTABLE=false` etc.) is green.
- If DR HSM was activated, re-clone the domain back to the rebuilt primary.
- Post-incident review with PKI + CISO; update session-pool health thresholds if detection lagged.

---

## Runbook 6 — S3 / object-store outage

Uploads/downloads/evidence writes failing; MinIO/S3 endpoint unreachable.

### Detection signals
- **Alerts:** `S3EndpointDown`, `ObjectStoreErrors` (5xx/timeout ratio from object ops high).
- **Metrics:** object-store client error rate; `pdf`/`index`/`sign` queues backing up on storage errors.
- **Logs:** API/worker logs with `S3` / `NoSuchBucket` / `SlowDown` / connection-refused to `minio.data.svc.cluster.local:9000` (or external S3).
- **Symptom:** users cannot upload/download documents; evidence sealing fails.

### Impact / severity
Document upload/download and evidence-package writes fail; signing that needs to seal/store fails downstream. **SEV2.** Reads of already-CDN-cached artifacts (CRL/OCSP, verification portal) continue.

### Immediate triage
```bash
# Endpoint reachability + basic ops.
kubectl -n $NS exec deploy/certidz-api -- sh -c 'nc -z minio.data.svc.cluster.local 9000 && echo s3-tcp-ok'
aws s3 ls s3://certidz-evidence/ --endpoint-url http://minio.data.svc.cluster.local:9000 | head
kubectl -n $DATA get po -l app=minio -o wide          # if self-hosted MinIO
kubectl -n $DATA logs -l app=minio --since=10m | tail -40
```
Classify: (a) endpoint/pod down, (b) network policy/DNS, (c) throttling (`SlowDown`), (d) provider regional outage (external S3).

### Step-by-step remediation
```bash
# (a) Self-hosted MinIO pod/statefulset down → restart / check storage.
kubectl -n $DATA rollout restart statefulset/minio
kubectl -n $DATA get pvc -l app=minio; kubectl -n $DATA describe po -l app=minio | grep -iE 'volume|mount|disk'

# (b) NetworkPolicy / DNS — confirm the data-zone policy still allows the app identity.
kubectl -n $DATA get networkpolicy
kubectl -n $NS exec deploy/certidz-api -- nslookup minio.data.svc.cluster.local

# (c) Throttling (SlowDown / 503) → back off; ensure retry/backoff is engaged; reduce concurrency.
kubectl -n $NS logs deploy/certidz-worker --since=5m | grep -c SlowDown
kubectl -n $NS set env deploy/certidz-worker S3_MAX_CONCURRENCY=8    # temporary throttle-down

# (d) External S3 regional outage → fail object traffic over to the EU replica bucket.
#     Evidence is CRR-replicated (RTC 15-min) and Object-Locked in both regions.
kubectl -n $NS set env deploy/certidz-api \
  S3_ENDPOINT=https://s3.eu-west-1.certidz.dz S3_REGION=eu-west-1
aws s3api list-object-versions --bucket certidz-evidence-eu --max-items 3 --region eu-west-1

# Queued writes recover automatically once the store returns (jobs are durable). Drain per Runbook 3.
kubectl -n $NS exec deploy/certidz-worker -- node dist/ops/queue-stats.js pdf index sign
```

> **Note:** Object Lock means writes cannot corrupt or delete existing evidence — worst case is *delayed* writes, never lost sealed evidence. To recover a bad/overwritten object use [DISASTER-RECOVERY.md §3.3](./DISASTER-RECOVERY.md#33-s3-object-restore-from-version).

### Escalation path
SRE on-call → Storage on-call → IC (SEV2) if uploads are down platform-wide. If failing over to the replica region, coordinate with the DR procedure and note residency constraints for Government tenants (no cross-border failover).

### Post-incident actions
- Confirm uploads/downloads/seals succeed; drain dependent queues.
- If failed over, plan controlled fail-back once primary store is healthy; re-verify CRR caught up.
- Verify evidence written during the incident re-validates as sealed (PAdES-B-LTA).
- Review retry/backoff + concurrency settings; tune throttle behavior.

---

## Runbook 7 — Credential-stuffing / elevated 401s

Auth brute force, lockouts, WAF/rate-limit response, SIEM `AUTH-BRUTE-01`.

### Detection signals
- **Alerts:** `AuthBruteForce` (SIEM `AUTH-BRUTE-01`), `Elevated401Rate` (401 ratio spike on `/auth/login`).
- **Metrics:** login-failure counters (per-IP / per-account) in Redis; 401/429 rate; lockout counter growth; distribution across many accounts (stuffing) vs one account (targeted).
- **Logs / SIEM:** `AUTH-BRUTE-01` events; WebAuthn `WEBAUTHN-CLONE-01`; token `TOKEN-REUSE-01` (may co-fire); WAF logs showing distributed source IPs / botnet patterns.

### Impact / severity
Attempted account takeover; legitimate users may hit lockouts/CAPTCHA. Auth controls (progressive delay, lockout, breach-check) are designed to hold. **SEV3** while contained; **SEV2** if any account is confirmed compromised (privileged → toward SEV1/2).

### Immediate triage
```bash
# Scope: is it one account (targeted) or many (stuffing)?  Redis counters.
redis-cli -h redis.data.svc.cluster.local -p 6379 --scan --pattern 'login:fail:ip:*' | head
redis-cli -h redis.data.svc.cluster.local -p 6379 --scan --pattern 'login:fail:acct:*' | wc -l
# Which source IPs / ASNs dominate? (SIEM / ingress logs)
kubectl -n $NS logs deploy/certidz-api --since=15m | grep '"path":"/auth/login"' \
  | grep '"status":401' | jq -r '.ip' | sort | uniq -c | sort -rn | head -20
```

### Step-by-step remediation
```bash
# 1. Confirm platform defenses are engaging (they should, automatically):
#    tiered delays, CAPTCHA at 6-8 fails, 15-min soft lock at 9-10, 1-h lock + step-up unlock beyond,
#    and AUTH-BRUTE-01 already raised (security doc §2.1). Verify a sampled offending IP is being throttled.

# 2. Block the abusive sources at the WAF / rate-limit edge (fastest containment).
#    Add offending IPs/ASNs to the WAF denylist (edge is out-of-band of app pods).
#    e.g. apply an updated rate-limit/deny rule set via IaC or the WAF console.
kubectl -n $NS get configmap edge-ratelimit -o yaml    # if rate-limit config is in-cluster
#    Tighten global login rate-limit temporarily if distributed/low-and-slow.

# 3. Protect targeted accounts: force lock + step-up-only unlock, invalidate sessions.
#    (Support/admin tooling; example ops script.)
kubectl -n $NS exec deploy/certidz-api -- node dist/ops/account-lock.js --email <victim> --reason stuffing
kubectl -n $NS exec deploy/certidz-api -- node dist/ops/logout-everywhere.js --email <victim>
#    logout-everywhere revokes all refresh families, deletes sess:*, bumps perms_ver.

# 4. Check for SUCCESSFUL logins from the attack window (breach confirmation).
kubectl -n $NS logs deploy/certidz-api --since=30m | grep '"path":"/auth/login"' \
  | grep '"status":200' | jq -r '{email:.user, ip:.ip, amr:.amr}' | sort | uniq -c | sort -rn
#    Any success on a targeted account from an attacker IP => CONFIRMED ATO => SEV2, involve CISO.

# 5. For confirmed compromise: force password reset, require MFA re-enroll, review WEBAUTHN-BE-FLIP /
#    signCount anomalies, and audit any sensitive actions taken (signing/pki/admin) in the session.
```

### Escalation path
SRE on-call → **Security/SOC on-call** (owns SIEM `AUTH-BRUTE-01`) → CISO if any account is confirmed compromised (SEV2), especially privileged/admin. Legal/DPO if personal data was accessed (breach-notification clock — see [DISASTER-RECOVERY.md §8.3](./DISASTER-RECOVERY.md#83-external-communications)).

### Post-incident actions
- Confirm attack subsided; lift temporary WAF/rate-limit tightening carefully.
- For any confirmed ATO: complete reset/MFA re-enroll, notify the tenant, log all decisions on the audit chain.
- Review breached-password (k-anonymity) coverage and lockout tuning; feed attacker IOCs to threat intel.
- If personal-data breach: DPO drives ANPDP/GDPR notification within regulatory windows.

---

## Runbook 8 — Customer data-restore request

Tenant asks to restore deleted/corrupted documents; point-in-time; legal-hold check; crypto-shred implications.

### Detection signals
- **Trigger:** authenticated support/legal request from a tenant Owner/Admin (not an alert). Logged as a ticket; requires identity verification of the requester.
- **Context:** accidental deletion, bad bulk operation, corruption, or ransomware-on-tenant-side asking for a point-in-time copy.

### Impact / severity
No platform outage. **SEV3** operationally, but with **compliance weight** — restoring data has legal-hold, residency, and crypto-shred implications that MUST be checked before acting.

### Pre-conditions — verify BEFORE restoring
```bash
# 1. Authorize the request: requester is tenant Owner/Admin, verified out-of-band; scope agreed in writing.
# 2. Legal-hold check — a tenant/matter under hold must NOT be altered; restoring may conflict.
kubectl -n $NS exec deploy/certidz-api -- node dist/ops/legal-hold-status.js --tenant <tid>
#    If under hold: STOP, route to Legal before any restore.
# 3. Crypto-shred check — if the data was erased via DEK destruction (Law 18-07 right-to-erasure),
#    it is CRYPTOGRAPHICALLY UNRECOVERABLE by design. Restoring is impossible and must not be attempted.
kubectl -n $NS exec deploy/certidz-api -- node dist/ops/dek-status.js --tenant <tid> --scope <docs>
#    DEK destroyed => inform requester it cannot be restored (this is the intended erasure guarantee).
# 4. Residency — Government/in-country tenants restore only within their in-country region.
```

### Step-by-step remediation
```bash
# CASE A: Object-level restore (specific documents/evidence overwritten or soft-deleted).
#   S3 versioning + Object Lock means prior versions still exist. Follow DR §3.3.
aws s3api list-object-versions --bucket certidz-evidence \
  --prefix 'tenants/<tid>/documents/<doc>' --region dz-alg-1
aws s3api copy-object --bucket certidz-evidence \
  --copy-source 'certidz-evidence/tenants/<tid>/documents/<doc>?versionId=<GOOD_VID>' \
  --key 'tenants/<tid>/documents/<doc>' --region dz-alg-1
#   Re-validate evidence seal integrity:
scripts/evidence/verify-seal.sh --key 'tenants/<tid>/documents/<doc>'

# CASE B: Point-in-time relational restore (metadata/envelope state corrupted by a bad operation).
#   NEVER PITR-restore the whole production database for one tenant. Restore into an ISOLATED cluster,
#   then extract only that tenant's rows (RLS-scoped) and merge back under review.
#   1) PITR into an isolated cluster to the pre-incident time (DR §3.1).
#   2) Extract tenant-scoped data with app.tenant_id set (respects RLS):
psql -h <isolated-restore-host> -U app_readonly -d certidz <<'SQL'
SET app.tenant_id = '<tid>';
\copy (SELECT * FROM documents WHERE tenant_id = current_setting('app.tenant_id')::uuid
       AND created_at <= '<point-in-time>') TO '/tmp/restore_documents.csv' CSV HEADER;
SQL
#   3) Reconcile + import the specific rows into prod under change control (dry-run diff first).

# CASE C: Whole-tenant point-in-time (major corruption). Treat as a scoped restore project with
#   Legal + DBA + the tenant; document scope, cutoff time, and verification plan. Isolated-cluster
#   restore + selective re-import; never bulk-overwrite live data.
```

### Escalation path
SRE on-call → **DBA on-call** for any PITR/relational restore → **Legal/DPO** for legal-hold or crypto-shred questions → CISO if the restore touches evidence integrity or crosses residency boundaries.

### Post-incident actions
- Verify restored objects re-validate (seal intact); confirm counts reconcile with the tenant.
- Record the restore on the **audit chain** (what, when, by whom, authorized by whom, scope, cutoff).
- Confirm the isolated restore cluster and any temporary extracts are securely destroyed.
- If a crypto-shred prevented restore, document that the erasure guarantee held (this is correct behavior, not a failure).
- Feed the root cause back to the tenant (e.g., enable soft-delete confirmations, tighten roles).

---

## Appendix A — Quick command reference

| Need | Command |
|---|---|
| API health | `curl -sf https://app.certidz.dz/api/v1/health \| jq .` |
| API pods | `kubectl -n certidz get po -l app=certidz-api -o wide` |
| Roll back API | `kubectl -n certidz rollout undo deploy/certidz-api` |
| Postgres roles/lag | `kubectl -n data exec sts/postgres-ha-0 -- patronictl -c /etc/patroni/patroni.yml list` |
| Replication lag | `psql -h postgres.data.svc.cluster.local -U postgres -c "SELECT now()-pg_last_xact_replay_timestamp();"` |
| Audit-chain verify | `psql ... -d certidz -c "SELECT verify_chain();"` |
| Queue depths | `kubectl -n certidz exec deploy/certidz-worker -- node dist/ops/queue-stats.js all` |
| bull-board UI | `kubectl -n certidz port-forward deploy/certidz-worker 3030:3030` |
| Redis queue len | `redis-cli -h redis.data.svc.cluster.local -p 6379 LLEN bull:sign:wait` |
| HSM test-sign | `kubectl -n certidz exec deploy/hsm-signing-svc -- hsm-cli test-sign --key-label 'certidz/tsa/tsa-signing/v3' --digest-sha256 <d>` |
| TLS expiry check | `echo \| openssl s_client -connect app.certidz.dz:443 2>/dev/null \| openssl x509 -noout -dates` |
| DNS check | `dig +short @1.1.1.1 app.certidz.dz` |
| WAL backup list | `wal-g backup-list --detail --pretty` |
| S3 versions | `aws s3api list-object-versions --bucket certidz-evidence --prefix <p>` |

## Appendix B — Escalation contacts (rotations)

| Role | Paged for | How |
|---|---|---|
| SRE on-call (primary) | All alerts first | PagerDuty/Opsgenie `sre-primary` |
| DBA on-call | Postgres promote/PITR, data-restore | `dba-oncall` |
| PKI / HSM on-call | HSM, CA/CRL/OCSP, TSA, mesh ICA | `pki-oncall` |
| Storage on-call | S3/MinIO outage | `storage-oncall` |
| Security / SOC on-call | Auth abuse, SIEM alerts, suspected breach | `soc-oncall` |
| Incident Commander | SEV1/SEV2 coordination | `ic-oncall` |
| CISO / CTO | DR declaration, SEV1, key compromise | Exec escalation |
| Legal / DPO | Legal hold, breach notification | `legal-dpo` |

---

*End of document. Runbooks are living operational artifacts — any gap discovered during a real incident is a tracked finding fixed within the post-incident review window (≤ 5 business days). Severities and the DR procedure are authoritative in [`DISASTER-RECOVERY.md`](./DISASTER-RECOVERY.md).*
