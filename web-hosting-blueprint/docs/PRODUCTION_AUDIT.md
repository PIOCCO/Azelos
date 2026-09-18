# Web Hosting Blueprint — Production Audit

**Audit date:** 2026-09-18  
**Scope:** `web-hosting-blueprint/` in Azelos monorepo  
**Method:** Repository inspection, static analysis, automated tests; runtime Docker tests **not executed** on audit VM (Docker daemon unavailable).

---

## 1. Executive summary

The Web Hosting Blueprint (WHBP) is a **configuration-first, CLI-driven** stack: client YAML → `render.py` → per-client Docker Compose + Nginx → `deploy.sh` / `health-check.sh` / `backup.sh`. It is **not** a multi-tenant SaaS control plane.

**Classification:** **B — usable hosting toolkit** for deploying **one client application stack per host** (or per distinct port map), operated by a provider via shell scripts. It is **not** D (production SaaS platform): no customer portal, no billing, no automated Let’s Encrypt, no centralized multi-customer monitoring.

**Technical readiness:** **READY WITH CONDITIONS** for a **single** managed client on a dedicated VPS/Azure VM when the operator manually handles DNS, TLS certificates, backup schedules, and alerting.

**Honest gap:** Advertising “managed hosting product” with SSL automation, multi-customer isolation on one server, rollback guarantees, or customer self-service would be **misleading** today.

---

## 2. Architecture

```text
Client YAML (config/clients/*.yaml)
        │
        ▼
validate.py (JSON Schema + policy)
        │
        ▼
render.py → .generated/<client-id>-<env>/
        ├── docker-compose.yml (proxy, frontend?, backend?, postgres?, redis?)
        ├── nginx/conf.d/default.conf (server_name = domains)
        └── .env.deploy (secrets from env)
        │
        ▼
deploy.sh → docker compose build/up → health-check.sh
        │
        ▼
Optional: backup/scripts/backup.sh → backup/storage/
Optional: Terraform VPS (infrastructure/terraform/environments/vps/) → Azure Linux VM
```

**Applications in repo:**

| Component | Role |
|-----------|------|
| `proxy/nginx` | Reverse proxy, `/healthz`, TLS termination when certs mounted |
| `frontend/examples/*` | static, react, vue, nextjs (SSR Dockerfile exists) |
| `backend/examples/*` | node, python, go, php (no demo client YAML for go/php/nextjs) |
| `automation/whbp/*` | validate, render, export inventory |
| `deployment/*` | deploy, rollback, restart, health-check |
| `backup/scripts/*` | pg_dump / psql restore |

**Empty / placeholder directories (no implementation):** `monitoring/metrics|health|logs`, `infrastructure/terraform/modules/*`, `infrastructure/docker/*`, `security/firewall`, `tests/health`.

---

## 3. Verified working features

| Feature | Evidence |
|---------|----------|
| Config validation | `pytest tests/configuration` — **6/6 passed** (includes invalid domain case) |
| Compose/nginx render | `pytest tests/deployment/test_render.py` — demos render; static stack has no redis |
| JSON Schema + env policies | `validate.py` + `config/environments/{development,staging,production}.yaml` |
| Deploy script flow (logic) | `deploy.sh`: validate → render → `.env.deploy` → optional scan → build/up → health-check → record history |
| Health endpoints | Proxy `nginx.conf` `/healthz`; backend `/health` via Host header in `health-check.sh` |
| Resource limits (optional) | `render.py` `_compose_limits` → compose `cpus` / `mem_limit` from client YAML |
| Log rotation (container) | json-file driver, `max-size` / `max-file` in render |
| Security headers (partial) | `proxy/nginx/snippets/security-headers.conf` included in generated vhosts |
| Secret-in-YAML guard | `validate.py` rejects database password in client file |
| Dev default secrets | Passwords from `WHBP_POSTGRES_PASSWORD` env (fallback `devpass` in deploy — **dev only**) |
| CI (GitHub Actions) | `.github/workflows/web-hosting-blueprint.yml`: validate 3 demos, pytest configuration, secret scan, Docker builds, render |
| Terraform VPS skeleton | `terraform validate` in `infrastructure/terraform/environments/vps/` — **Success** |
| Inventory export hook | `export_inventory.py` on successful deploy (BCDR integration path) |
| Production deploy guard | Requires `WHBP_PRODUCTION_APPROVED` for `environment.type: production` |

---

## 4. Partially working features

| Feature | What works | What does not |
|---------|------------|----------------|
| **HTTPS** | Nginx 443 + redirect when `ssl.enabled: true` and cert files present | No Certbot/ACME automation; `ssl.provider` / `ssl.email` **ignored** by code (`docs/ssl.md` manual certs) |
| **Rollback** | Records deployment history; failed deploy triggers rollback script | `rollback.sh` runs `down`/`up` but **does not pin** saved image IDs from `.previous-images` — not deterministic rollback |
| **Blue-green** | Validated in config | `deploy.sh` always rolling single stack |
| **Hosting profiles** | `small` / `standard` / `resilient` validated | **No effect** on render or deploy |
| **Security scan** | `scan-images.sh` invoked | Exits success unless Trivy installed |
| **Backup** | `backup.sh` pg_dump when postgres running | No schedule, no encryption, no off-host copy, **no automated restore test** in CI |
| **Restore** | `restore.sh` pipes SQL to psql | Not integrated into deploy; operator must run manually |
| **Monitoring** | Per-container healthchecks, deploy JSON reports | No uptime alerting, no SSL expiry, no disk/CPU alerts in repo |
| **Multi-workload** | 3 demo configs: static, react+node+pg, vue+python+pg+redis | Go, PHP, Next.js examples **not** in CI demo matrix |
| **Integration test** | `tests/integration/test_deploy_static.sh` | **Skipped** when Docker unavailable (this audit environment) |

---

## 5. Broken or misleading features

| Issue | Evidence |
|-------|----------|
| **Rollback does not restore previous images** | `rollback.sh` lines 46–48: checks `.previous-images` but only `down`/`up` without image tag rollback |
| **Example client template YAML error** | `config/client.example.yaml` had invalid `version: "16" "16"` — **fixed during audit** to single `"16"` |
| **“Future dashboard” documented as product** | README/architecture describe API/control plane — **no HTTP API or UI exists** |

---

## 6. Missing features (production hosting product)

- Automatic Let’s Encrypt / certificate renewal and failure alerting  
- Host-level multi-customer routing (see §9)  
- Customer portal vs provider admin  
- Billing / subscriptions / invoicing  
- Scheduled backups + retention policy enforcement  
- Off-site backup storage  
- Centralized log aggregation and retention policy  
- Alerting pipeline (email/Slack/PagerDuty)  
- Deployment rollback to known-good image digest  
- MySQL/MariaDB support (PostgreSQL only)  
- PHP/Go production demo path and CI coverage  
- Firewall/IaC hardening beyond bare Azure VM  
- Rate limiting / WAF at edge  
- Per-customer bandwidth accounting  
- Suspend/offboard customer automation  

---

## 7. Security findings

| Severity | Finding |
|----------|---------|
| **High** | Default compose DB password fallback `devpass` if env unset (`deploy.sh`, `health-check.sh`) — unacceptable in production without mandatory env |
| **High** | PostgreSQL/Redis **expose** only on Docker network (good), but misconfigured host publishing would expose DB — operator responsibility |
| **Medium** | No HSTS header in `security-headers.conf` (even when SSL enabled) |
| **Medium** | No CSP header |
| **Medium** | No API auth (no control plane API) — N/A today; SSH and Docker access are the attack surface |
| **Low** | Trivy scan optional/no-op without tool |
| **Positive** | Backend not public by default (`expose` not `ports`); proxy fronts traffic |
| **Positive** | `secret-scan.sh` in CI |
| **Positive** | Validator blocks passwords in client YAML |

**Secrets in Git:** No committed live secrets found; `.env.example` uses placeholders; test/integration uses `devpass` label only.

---

## 8. Reliability findings

- Containers use `restart: unless-stopped` — Docker will restart crashed containers **on same host**.  
- No orchestrated failover or second region.  
- Deploy failure: health-check failure calls rollback, but rollback quality is weak (§4).  
- Database: named volume `postgres_data` — survives container restart; **not** tested end-to-end in this audit (no Docker).  
- **Failure tests (simulated by code review):**

| Test | Expected per spec | Actual |
|------|-------------------|--------|
| App container crash | Detect → restart → alert | Restart likely; **no alert** |
| DB unavailable | Alert + procedure | Health-check fails deploy; **no ongoing DB alert** |
| Disk full | Warning | **Not implemented** |
| SSL expiry | Detection | **Not implemented** |
| Failed deploy | Previous version live | Attempts rollback; **previous version not guaranteed** |
| Backup fail | Alert | **Not implemented** |
| Resource limit exceeded | Throttle/isolate | Compose limits may OOM-kill service; **no provider alert** |

---

## 9. Backup / DR findings

**Backed up:** PostgreSQL logical dump via `pg_dump` when stack running.  
**Not backed up by script:** Redis AOF volume, uploaded files in containers, Nginx certs, client source.  
**Schedule:** None in code — operator must cron.  
**Retention:** Files accumulate under `backup/storage/` — no rotation in script.  
**Encryption:** None.  
**Off-host:** None.  
**RPO/RTO:** Undefined; restore is manual `restore.sh`.  
**Restore tested in CI:** No.

---

## 10. Scalability findings

**Model:** One rendered stack binds proxy **`80:80` and `443:443`**. A second client on the **same VM** conflicts on ports unless the operator remaps ports or adds a **host-level** reverse proxy — **not automated**.

**Capacity (assumptions — not load-tested):**

| Profile | Rough stack RAM (limits in demo YAML) | Indicative capacity on 4 GB VPS |
|---------|--------------------------------------|----------------------------------|
| `demo-static` | proxy + static frontend (~512M class) | Many static sites **if** host nginx multiplexes domains — **not in BP** |
| `demo-react-node` | ~1.25 GB limits declared | **1–2** small app stacks per 4 GB VM with port conflict resolution |
| `demo-vue-python` + redis | higher | **1** standard app per small VM typical |

**First bottleneck:** Host RAM and **single 80/443 binding** per compose project.  
**Scale path documented:** `docs/scaling.md` — multiple VPS before Kubernetes (appropriate).

---

## 11. Deployment findings

**Supported workload types (implemented + CI-built):**

| Type | Support |
|------|---------|
| Static HTML | Yes (demo-static) |
| React SPA | Yes |
| Vue SPA | Yes |
| Next.js | Dockerfile.ssr exists; **no demo client / CI build** |
| Node API | Yes |
| Python/FastAPI | Yes (vue demo) |
| Go / PHP | Examples only |
| PostgreSQL | Yes |
| Redis | Yes (vue demo) |
| MySQL/MariaDB | No |
| Docker Compose customer apps | Partial — must map into WHBP YAML/build contexts |

**DNS / routing:** `server_name` from `domains.frontend` / `domains.backend` — deterministic **per stack**. Isolation between customers on one host requires **distinct domains + host-level routing**; not proven in repo.

---

## 12. Operational risks

1. Manual TLS lifecycle → outage or browser warnings if certs lapse.  
2. Weak rollback → bad deploy may leave broken state.  
3. No monitoring → provider learns of outage from customer.  
4. Backup script skipped silently if postgres not running (`verified.txt` says SKIP).  
5. Operator skill required (Docker, DNS, TLS, Postgres restore).  
6. `hosting.profile` and `blue-green` suggest capabilities that are not implemented — sales/engineering mismatch risk.

---

## 13. Evidence from tests

| Command | Result (audit VM) |
|---------|-------------------|
| `PYTHONPATH=. python3 -m pytest tests/configuration tests/deployment -q` | **6 passed** |
| `tests/integration/test_deploy_static.sh` | **SKIP: docker not available** |
| `terraform validate` (VPS env) | **Success** |
| `docker compose config/build/up` | **Not run** — Docker not installed on audit VM |
| CI workflow | Validates configs, builds images, renders compose on GitHub runners (expected green on main) |

---

## Productization classification (reference)

| Level | Assessment |
|-------|------------|
| A — Technical demo | Exceeded |
| **B — Usable hosting platform (operator-run)** | **Yes** |
| C — Productized managed hosting | **No** — missing SSL automation, monitoring, billing, portal |
| D — Production SaaS | **No** |
