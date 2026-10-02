# DORA BP — Azure Production Validation Report

**Validation run:** 2026-10-02 (Cloud Agent environment)  
**Repository:** `Azelos_DORA_BP`  
**Branch context:** `cursor/pdf-evidence-export-f761` (local validation; not deployed to Azure)

---

## Executive summary

| Gate | Result |
|------|--------|
| **Azure staging deployment (Phases 3–4)** | **NOT EXECUTED** — no `az` CLI, no Azure credentials, no subscription access in validation VM |
| **Azure production deployment (Phases 21–22)** | **NOT EXECUTED** |
| **Local / CI-equivalent validation (Phases 0–2, 13–14 partial)** | **EXECUTED** — see evidence below |
| **Final production gate** | **NOT READY FOR PRODUCTION** |

Production readiness requires a human/operator run in Azure with credentials, DNS, secrets, blob storage, and full E2E UI tests. This report records what was **actually** verified vs. what remains.

---

## Phase 0 — Architecture map (from repository)

```text
User (browser)
 ↓ HTTPS
Azure Container Apps ingress (external, target port 8000)
 ↓
Single container: Dockerfile.app
  ├── FastAPI (uvicorn :8000)
  ├── React SPA (static from /app/frontend/dist when SERVE_FRONTEND=1)
  └── Alembic on container entrypoint (docker-entrypoint.sh)
 ↓
PostgreSQL Flexible Server 16 (private VNet; no public 5432)
 ↓
Evidence / exports object storage
  ├── Local: STORAGE_LOCAL_PATH (dev / single-container)
  └── Azure: STORAGE_PROVIDER=azure_blob + Storage Account (Terraform module)
```

**Supporting Azure (Terraform `infra/terraform/`):**

- Resource group, VNet, NSGs, delegated subnet for PostgreSQL
- Azure Container Registry (AcrPull via managed identity)
- Key Vault (`database-url`, `jwt-secret-key`, PostgreSQL admin password)
- Storage Account (containers for evidence/exports)
- Log Analytics + Application Insights
- **Not in Terraform:** Alembic migrations, seed data, custom domain/Front Door (optional future)

**Application components:**

| Area | Location |
|------|----------|
| Frontend | `frontend/` (Vite + React) |
| Backend | `backend/app/` (FastAPI) |
| Migrations | `backend/alembic/` (head: `010_v1_saas_bia`) |
| Auth | JWT login `/api/v1/auth/login`; optional OIDC flags |
| RBAC | `app/core/rbac.py`, route dependencies |
| Multi-tenancy | `financial_entity_id` on entities; token carries org context |
| PDF evidence | `evidence_attachment_service`, local or blob storage |
| PDF export | e.g. `dora-assessment.pdf` (reportlab) |
| Relation map | GraphQL + `RelationshipMapPage.tsx` |
| Pilot docs | `docs/pilot/` |

---

## Phase 1 — Production configuration audit (static)

### Checklist (no secret values listed)

| Item | Status | Notes |
|------|--------|-------|
| Committed production secrets | **WARN** | `.env.example` uses placeholders; `backend/.env` exists locally with default JWT (must not commit). Verify `.gitignore` in your clone. |
| `APP_ENV=production` | **OK (code)** | `validate_production_settings()` fails fast on default JWT or `CORS=*` |
| Default JWT | **BLOCKER if unset** | Tested: `APP_ENV=production` + default key → `RuntimeError` (expected) |
| CORS | **Must set per env** | Compose uses localhost origins; staging/prod tfvars use `var.cors_origins` |
| `DEBUG=True` | **N/A** | FastAPI; no Django DEBUG |
| Frontend API URL | **OK** | `VITE_API_BASE_URL` empty in prod build → same-origin `/api` |
| localhost in prod bundle | **OK** | Grep of `frontend/dist` — no localhost in built JS |
| Dev proxy localhost | **Dev only** | `vite.config.ts` proxies to 127.0.0.1:8000 |
| Demo seeds | **Documented** | `seed_pilot_demo.py` / `seed_dev.py` — must not run on prod customer DB |
| Login page default email | **P2** | `admin@demo.bank` prefilled — dev convenience only |
| Storage for Azure | **Config required** | Set `STORAGE_PROVIDER=azure_blob` + account/container env vars (see `.env.example`) |

### Patterns found (non-blocking in dev)

- `127.0.0.1` / `localhost` in docs, compose, vite, acceptance scripts
- `pilot-demo`, `seed_pilot_demo`, demo passwords in **pilot docs only** (not in frontend bundle)
- Test fixtures use `fake` tokens — test-only

---

## Phase 2 — Build artifacts

| Check | Result | Evidence |
|-------|--------|----------|
| Frontend `npm run build` | **PASS** | tsc + vite build succeeded |
| Backend imports / pytest | **PASS** | 112 tests passed (43s) |
| Terraform staging validate | **PASS** | `terraform validate` in `environments/staging` |
| Docker image build | **NOT RUN** | Docker CLI/daemon **not available** in validation VM |
| Docker Compose stack | **NOT RUN** | Same limitation |

---

## Phases 3–4 — Azure staging (NOT EXECUTED)

**Blockers:**

- `az` CLI not installed; no Azure login/session
- Cannot create resource group, ACA, PostgreSQL, storage, or deploy images

**Prepared IaC (review only):**

| Environment | Path | Purpose |
|-------------|------|---------|
| Bootstrap | `infra/terraform/bootstrap/` | Remote state storage |
| Staging | `infra/terraform/environments/staging/` | Pre-prod |
| Prod | `infra/terraform/environments/prod/` | Production |
| Dev | `infra/terraform/environments/dev/` | Development |

**Operator steps (from `infra/terraform/README.md`):** bootstrap state → `terraform apply` per env → push image to ACR → set Key Vault secrets → run Alembic from VNet-connected agent → hit `/health` and `/ready`.

---

## Phases 5–12 — Runtime E2E (partial)

### Executed locally (API + running uvicorn)

| Workflow | Tested | Result | Evidence |
|----------|--------|--------|----------|
| Health / ready | Yes | **PASS** | `GET /health` → alive; `/ready` → DB + schema OK |
| Migrations | Yes | **PASS** | Alembic head `010_v1_saas_bia`, no pending |
| Pilot demo chain | Yes | **PASS** | `scripts/verify_nordhaven_demo.py` — 17/17 PASS |
| Authentication (API) | Partial | **PASS** | Login in verify script; production JWT validation tested in isolation |
| RBAC / tenant (automated) | Partial | **PASS** | `test_integration_security.py`, `test_fastapi_tenant.py`, etc. in full suite |
| PDF evidence (API) | Partial | **PASS** | `test_requirement_evidence_pdf.py`, verify script evidence download |
| PDF export | Partial | **PASS** | verify script `Report dora-assessment` |
| Relation map (API) | Partial | **PASS** | verify script GraphQL nodes=14 |
| UI (browser) | **NOT RUN** | Browser agent unavailable | Manual required in Azure/staging |

### NOT executed in this run

- OAuth (if enabled): `OIDC_*` — not configured in local `.env`
- Full RBAC matrix per role in UI
- Multi-tenant manual A/B with two live users + PDF cross-tenant in browser
- Failure injection (DB/storage outage) on deployed Azure
- Performance under concurrent users
- Clean customer simulation without developer shortcuts (UI)
- Sidebar/main scroll regression (UI)
- Import button visual (UI) — code review only; duplicate `+` fixed in `EvidenceAttachmentsPanel`

---

## Phase 13 — API testing (automated suite)

**Result:** **112 passed** — includes auth, tenant isolation, evidence, security hardening, e2e org flow, GraphQL, production readiness, customer validation, schema health, storage, portability.

**Not a substitute for:** production URL, Azure networking, blob storage, or rate limits under real load.

---

## Phase 14 — Database validation

| Check | Result |
|-------|--------|
| Migrations apply | **PASS** (test session + live DB on :5432) |
| Integrity tests | **PASS** (`test_database_integrity.py`) |
| Restart persistence | **NOT RUN** (no Docker restart test) |

---

## Phases 15–18 — Failure / backup / observability (Azure)

| Area | Status |
|------|--------|
| ACA restart / health probes | **Defined in Terraform** — not exercised |
| DB backup | **Terraform:** `postgresql_backup_retention_days` (staging example: 14) — restore **not tested** |
| Evidence backup | **Operator:** blob GRS on staging module — restore **not tested** |
| Logs | Log Analytics wired in module — **not verified** in Azure |

---

## Phase 16 — Security (static + tests)

| Area | Result | Finding |
|------|--------|---------|
| Broken access control / IDOR | **Tests pass** | Cross-tenant provider → 404 |
| Auth | **Tests pass** | Missing/invalid token → 401 |
| SQL injection surface | **Tests pass** | No `/execute-sql` endpoint |
| Production JWT | **Enforced** | Fail fast without 32+ char secret |
| CORS `*` in production | **Blocked** | RuntimeError |
| File upload | **Tests pass** | PDF validation, wrong MIME rejected |
| Secrets in repo | **Review** | Ensure `backend/.env` not committed |

Full OWASP manual pen-test on **deployed** Azure URL: **NOT DONE**.

---

## Phase 19 — Performance

**NOT RUN** (no staging deployment).

---

## Phase 20 — Customer simulation

**Partial:** API-only Nordhaven path via `verify_nordhaven_demo.py`.  
**Not done:** UI-only walkthrough using customer docs without scripts.

Known doc gaps (from `docs/pilot/PILOT-READINESS-AUDIT.md`): applicability read-only, JSON reports vs PDF expectations, tenant ZIP API-only, evidence–requirement link UI limited.

---

## Phases 21–22 — Production deploy & smoke

**NOT EXECUTED.**

---

# Final report tables

## 1. Deployment

| Component | Azure Resource (planned) | Status |
|-----------|--------------------------|--------|
| Frontend | Served from ACA app container (`SERVE_FRONTEND=1`) | **Not deployed** |
| Backend | ACA `${name_prefix}-app` | **Not deployed** |
| Database | PostgreSQL Flexible Server (private) | **Not deployed** |
| Storage | Storage Account evidence container | **Not deployed** |
| HTTPS/Domain | ACA ingress TLS | **Not configured** |
| Monitoring | Log Analytics / App Insights | **Not verified** |

## 2. Core workflow

| Workflow | Tested | Result | Evidence |
|----------|--------|--------|----------|
| Authentication | Partial | **PASS (API/tests)** | pytest + verify script |
| RBAC | Partial | **PASS (tests)** | pytest suite |
| Multi-tenancy | Partial | **PASS (tests)** | integration security tests |
| Suppliers | Partial | **PASS (API chain)** | verify script |
| Risk Assessment | Partial | **PASS (API chain)** | verify script |
| DORA Functions | Partial | **PASS (API chain)** | verify script |
| PDF Evidence | Partial | **PASS (tests + API)** | pytest + download 200 |
| PDF Export | Partial | **PASS (API)** | dora-assessment in verify script |
| Relation Map | Partial | **PASS (API)** | GraphQL node count |
| Reports | Partial | **PASS (API)** | overview + assessment |

## 3. Security

| Area | Result | Finding |
|------|--------|---------|
| Authentication | Pass (automated) | Live Azure OAuth not tested |
| Authorization | Pass (automated) | UI not fully exercised |
| Tenant isolation | Pass (automated) | Re-test on Azure with two tenants |
| API security | Pass (automated) | |
| PDF security | Pass (automated) | Cross-tenant evidence IDOR tests in suite |
| Secrets | Review | Production requires KV + strong JWT |
| Dependencies | Not run | Recommend `pip audit` / `npm audit` in CI |

## 4. Reliability

| Test | Result |
|------|--------|
| Backend restart | Not run (no Docker/Azure) |
| DB failure | Not run |
| Storage failure | Not run |
| Backup/restore | Not run |

## 5. Customer simulation

**Succeeded (API):** Nordhaven demo chain end-to-end via HTTP.  
**Failed / incomplete:** Full UI pilot using only customer docs; Azure-hosted URL onboarding.

## 6. Issues

### P0

| ID | Issue | Evidence | Status |
|----|-------|----------|--------|
| P0-1 | **No Azure staging/production deployment validated** | No `az`, no deploy | **Open** |
| P0-2 | **Production E2E not verified on real HTTPS URL** | UI/browser tests not run | **Open** |
| P0-3 | **Azure blob storage for evidence not validated in runtime** | Local `STORAGE_PROVIDER=local` only in this run | **Open** |

### P1

| ID | Issue | Evidence | Status |
|----|-------|----------|--------|
| P1-1 | Docker compose full stack not smoke-tested in CI/agent | No Docker in VM | **Open** |
| P1-2 | DB/evidence backup restore not tested | — | **Open** |
| P1-3 | Alembic from VNet job not exercised | Terraform docs only | **Open** |
| P1-4 | Customer docs vs product (reports JSON, ZIP export UI) | PILOT-READINESS-AUDIT | **Open (docs)** |

### P2

| ID | Issue |
|----|-------|
| P2-1 | Login prefilled `admin@demo.bank` |
| P2-2 | GraphQL introspection disabled in prod but verify in Azure |
| P2-3 | Persistent relation-map layouts (product limitation noted in audit) |

### P3

| ID | Issue |
|----|-------|
| P3-1 | Front Door / CDN |
| P3-2 | UI for tenant ZIP export |

## 7. Final gate

## **NOT READY FOR PRODUCTION**

### Remaining P0/P1 blockers

1. Deploy and smoke-test **staging** in Azure (ACA + private PostgreSQL + Key Vault + blob storage + ACR image).
2. Configure production secrets (`JWT_SECRET_KEY` ≥32 chars, `CORS_ORIGINS`, `APP_ENV=production`, `STORAGE_PROVIDER=azure_blob`).
3. Run Alembic from a VNet-connected runner; provision first **real** customer tenant (not `seed_pilot_demo`).
4. Execute Phases 5–12 and 22 manually on staging URL (auth, RBAC, tenant isolation with PDFs, UI scroll/map, evidence import/view/download).
5. Complete backup/restore drill for PostgreSQL and evidence blob container.
6. Re-run this checklist on **production** after staging sign-off.

### Evidence that *does* support readiness to **begin Azure staging work**

- 112/112 backend tests passing  
- Terraform staging configuration validates  
- Production config guardrails enforce JWT and CORS  
- Production frontend build has no baked-in localhost API URL  
- Live local API: `/health`, `/ready`, and `verify_nordhaven_demo.py` all pass  

---

## Recommended operator command sequence (staging)

```bash
# On operator workstation with Azure access:
cd Azelos_DORA_BP/infra/terraform/bootstrap && terraform apply
cd ../environments/staging && terraform init -backend-config=backend.hcl && terraform plan && terraform apply
az acr login --name <acr>
docker build -f Dockerfile.app -t <acr>/dora-bp-app:<tag> .
docker push <acr>/dora-bp-app:<tag>
# Run alembic upgrade from VNet-connected environment with DATABASE_URL from Key Vault
curl -s https://<aca-fqdn>/health
curl -s https://<aca-fqdn>/ready
# Manual E2E + tenant isolation tests
```

Do **not** run `seed_pilot_demo.py` on a database shared with real customer tenants.
