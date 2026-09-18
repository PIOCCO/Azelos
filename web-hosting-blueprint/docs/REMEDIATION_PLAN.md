# Web Hosting Blueprint — Remediation Plan

Prioritized from production and profitability audits (2026-09-18).  
Complexity: **S** (hours–1 day), **M** (2–5 days), **L** (1–2+ weeks).

---

## CRITICAL

### C1 — Rollback does not restore previous container images

| Field | Detail |
|-------|--------|
| **Evidence** | `deployment/rollback.sh`: writes `.previous-images` in `deploy.sh` but rollback only runs `docker compose down/up` without tagging or `compose up` with prior digests |
| **Impact** | Failed deploy may not return to last good version; false sense of safety |
| **Fix** | Save image tags/digests per service in `deployment-history.json`; rollback via `docker compose up` with `image:` overrides or retag previous images |
| **Complexity** | M |
| **Dependency** | Docker on deploy host |

### C2 — No automatic TLS (Let’s Encrypt)

| Field | Detail |
|-------|--------|
| **Evidence** | `render.py` expects manual `fullchain.pem`/`privkey.pem`; `ssl.provider` unused; `docs/ssl.md` manual only |
| **Impact** | Production HTTPS depends on operator discipline; expiry outages |
| **Fix** | Documented certbot flow **or** optional certbot/ACME sidecar service in render; renewal cron + health check for cert expiry |
| **Complexity** | M |
| **Dependency** | Public DNS pointing to host |

### C3 — Single stack occupies host ports 80/443

| Field | Detail |
|-------|--------|
| **Evidence** | `render.py` proxy `ports: ["80:80", "443:443"]` |
| **Impact** | Cannot run two default WHBP stacks on one VM without manual port/host nginx design — blocks dense multi-customer hosting |
| **Fix** | Document **one VM per client** OR add `hosting.mode: shared` with host-level nginx template and non-privileged app ports |
| **Complexity** | L (shared mode) / **S** (document dedicated VM model) |
| **Dependency** | Product decision |

### C4 — Production default database password fallback

| Field | Detail |
|-------|--------|
| **Evidence** | `deploy.sh` / `health-check.sh`: `WHBP_POSTGRES_PASSWORD:-devpass` |
| **Impact** | Weak credentials if env omitted |
| **Fix** | Fail deploy if password unset when `environment.type != development` |
| **Complexity** | S |
| **Dependency** | None |

---

## HIGH

### H1 — No monitoring or alerting integration

| Field | Detail |
|-------|--------|
| **Evidence** | `monitoring/*` empty; `docs/monitoring.md` suggests optional node_exporter only |
| **Impact** | Outages discovered by customers; no SSL/disk/backup failure signal |
| **Fix** | Minimum: document Uptime Kuma / healthchecks.io + wire deploy to push check URLs; optional Prometheus compose profile |
| **Complexity** | M |
| **Dependency** | External SaaS or self-hosted monitor |

### H2 — Backup not scheduled, rotated, or verified

| Field | Detail |
|-------|--------|
| **Evidence** | `backup/scripts/backup.sh` manual; no retention; CI does not test restore |
| **Impact** | RPO/RTO unknown; “we have backups” may be untrue |
| **Fix** | Cron example + retention script; integration test `backup → drop table → restore` in CI with Docker |
| **Complexity** | M |
| **Dependency** | Docker in CI |

### H3 — Integration test skipped in dev/audit environments

| Field | Detail |
|-------|--------|
| **Evidence** | `test_deploy_static.sh` exits 0 with SKIP when no Docker |
| **Impact** | Regressions in deploy path undetected locally |
| **Fix** | CI already builds/renders; add job `docker compose up` smoke on PR (GitHub has Docker) |
| **Complexity** | S |
| **Dependency** | GitHub Actions |

### H4 — `hosting.profile` and `blue-green` mislead operators

| Field | Detail |
|-------|--------|
| **Evidence** | Validated in `validate.py`; no implementation in `render.py`/`deploy.sh` |
| **Impact** | Wrong architecture promises to clients |
| **Fix** | README/docs mark as **planned** OR implement minimal profile defaults (resource sizes) |
| **Complexity** | S (docs) / M (implement) |
| **Dependency** | Product |

### H5 — No customer/provider separation

| Field | Detail |
|-------|--------|
| **Evidence** | README “Future control plane”; no auth, no tenant API |
| **Impact** | Cannot sell self-service; all access is SSH/Docker |
| **Fix** | Phase 2 control plane (out of scope for minimal WHBP) — document CLI-only model clearly in sales collateral |
| **Complexity** | L |
| **Dependency** | Product roadmap |

---

## MEDIUM

### M1 — HSTS and CSP not set

| Field | Detail |
|-------|--------|
| **Evidence** | `security-headers.conf` missing HSTS/CSP |
| **Impact** | Weaker browser-side protections on HTTPS sites |
| **Fix** | Add HSTS when SSL enabled; baseline CSP for static/React |
| **Complexity** | S |
| **Dependency** | None |

### M2 — Go, PHP, Next.js not in CI/demo clients

| Field | Detail |
|-------|--------|
| **Evidence** | CI builds static/react/vue/node/python only |
| **Impact** | Claimed framework support untested |
| **Fix** | Add demo client YAML + CI build for each or mark “community/unverified” in docs |
| **Complexity** | M |
| **Dependency** | None |

### M3 — Terraform modules empty

| Field | Detail |
|-------|--------|
| **Evidence** | `infrastructure/terraform/modules/*` empty; only VPS VM |
| **Impact** | No IaC for DB backup vault, NSG hardening, etc. |
| **Fix** | NSG restricting 22/80/443; optional backup storage module |
| **Complexity** | M |
| **Dependency** | Azure subscription |

### M4 — Trivy scan no-op without installation

| Field | Detail |
|-------|--------|
| **Evidence** | `scan-images.sh` behavior |
| **Impact** | False confidence from “security scan” step |
| **Fix** | Fail in CI if Trivy missing, or install Trivy in workflow |
| **Complexity** | S |
| **Dependency** | CI |

### M5 — Restore script requires running postgres without pre-check

| Field | Detail |
|-------|--------|
| **Evidence** | `restore.sh` direct exec |
| **Impact** | Operator error during incident |
| **Fix** | Pre-flight checks + documented RTO steps in `docs/backup.md` |
| **Complexity** | S |
| **Dependency** | None |

---

## LOW

### L1 — Empty placeholder directories

| Field | Detail |
|-------|--------|
| **Evidence** | monitoring, firewall, tests/health empty |
| **Impact** | Confusing repo navigation |
| **Fix** | README in each stating “intentionally empty” or remove dirs |
| **Complexity** | S |

### L2 — Production CI job is echo-only

| Field | Detail |
|-------|--------|
| **Evidence** | `.github/workflows/web-hosting-blueprint.yml` production job |
| **Impact** | None if understood as guardrail |
| **Fix** | SSH deploy template (optional, security-sensitive) |
| **Complexity** | M |
| **Dependency** | VPS credentials |

### L3 — Log aggregation not included

| Field | Detail |
|-------|--------|
| **Evidence** | json-file driver only |
| **Impact** | Harder troubleshooting at scale |
| **Fix** | Optional Loki/Vector sidecar doc |
| **Complexity** | M |

---

## Recommended execution order

1. **C4** — block weak prod passwords  
2. **C1** — real rollback  
3. **C2** — TLS automation or mandatory runbook  
4. **H1 + H2** — monitoring + backup schedule/restore test  
5. **C3** — document or implement multi-customer host model  
6. **H3** — full Docker smoke in CI  
