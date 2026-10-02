# Azure deployment plan (from repository source of truth)

**Generated:** inspection of `Azelos_DORA_BP` for staging → production hosted SaaS.  
**Target image:** `Dockerfile.app` (single container: FastAPI + built React on port **8000**).

---

## 1. Application architecture (as implemented)

```text
User (HTTPS)
    ↓
Azure Container Apps ingress (external, port 8000)
    ↓
Container: dora-bp-app
    ├── uvicorn → FastAPI `/api/v1`, `/graphql`, `/health`, `/ready`
    ├── SERVE_FRONTEND=1 → static React SPA + SPA fallback
    └── docker-entrypoint.sh → alembic upgrade head on start
    ↓
PostgreSQL Flexible Server 16 (private VNet; sslmode=require)
    ↓
Azure Blob Storage (evidence) via managed identity
```

| Layer | Technology | Repo reference |
|-------|------------|----------------|
| Frontend build | Vite + React | `frontend/` → `npm run build` → `frontend/dist` |
| Backend | FastAPI 3.12 | `backend/app/` |
| Combined deploy | `Dockerfile.app` | Copied into image at `/app/frontend/dist` |
| Alt dev layout | `docker-compose.yml` | Postgres + optional `full` profile (backend + nginx frontend) |
| Multitenancy | Single platform DB | `financial_entity_id` on rows; JWT `org_id` |
| Auth | JWT (+ optional OIDC env) | `backend/app/api/v1/auth.py` |
| Evidence | `STORAGE_PROVIDER` | `local` (dev) / `azure_blob` (Terraform staging/prod) |
| IaC | Terraform | `infra/terraform/environments/{staging,prod}` |

**Not required for core operation:** Redis, separate frontend host (when using `Dockerfile.app`), AKS, Front Door (optional future).

---

## 2. Build procedures

### Frontend

```bash
cd Azelos_DORA_BP/frontend
npm ci
npm run build
```

- Production API base: `VITE_API_BASE_URL` empty → same-origin requests (`getApiBase()` in `frontend/src/api/client.ts`).
- Dev proxy: `vite.config.ts` → `127.0.0.1:8000` (dev only).

### Backend

```bash
cd Azelos_DORA_BP/backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Production container (intended Azure path)

```bash
cd Azelos_DORA_BP
docker build -f Dockerfile.app -t <acr>.azurecr.io/dora-bp-app:<tag> .
docker push <acr>.azurecr.io/dora-bp-app:<tag>
```

**Deployment compatibility notes:**

| Item | Status |
|------|--------|
| `Dockerfile.app` installs `.[dev]` only | Azure Blob needs **`[azure]`** optional deps (`azure-identity`, `azure-storage-blob`) when `STORAGE_PROVIDER=azure_blob` |
| Terraform sets `STORAGE_PROVIDER=azure_blob` | `infra/terraform/modules/platform/main.tf` |
| `APP_ENV=production` | **Not** set in Terraform today; defaults to `development` in `Settings` — should be set for staging/prod (JWT/CORS/introspection guards) |
| Entrypoint runs Alembic every start | `backend/scripts/docker-entrypoint.sh` |
| Private PostgreSQL | Migrations from ACA only if network path exists; operator may run one-off job in VNet |

---

## 3. PostgreSQL

- **One database per environment** (`DATABASE_URL` from Key Vault in ACA).
- Driver: `postgresql+psycopg://` (psycopg3).
- SSL: `DB_SSL_MODE=require` in Terraform app env; connection string includes `sslmode=require`.
- Migrations: Alembic only (`backend/alembic/`, head revision chain through `012_integration_audit_enum`).
- **Never** point staging at production DB.

---

## 4. Mandatory environment variables

### Secrets (Key Vault → ACA secrets)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Platform PostgreSQL |
| `JWT_SECRET_KEY` | JWT signing (≥32 chars when `APP_ENV=production`) |

### Non-secret (Terraform `app_environment_variables` + overrides)

| Variable | Staging/prod (Terraform) | Dev |
|----------|-------------------------|-----|
| `SERVE_FRONTEND` | `1` | optional |
| `STORAGE_PROVIDER` | `azure_blob` | `local` |
| `AZURE_STORAGE_ACCOUNT` | from storage module | — |
| `AZURE_STORAGE_CONTAINER` | evidence container name | — |
| `CORS_ORIGINS` | staging/prod HTTPS URL | localhost |
| `DB_SSL_MODE` | `require` | optional |
| `APP_ENV` | **should be `production`** | `development` |
| `AUTO_MIGRATE_DB` | optional `0` if migrations run in CI/job | `1` |

Optional: `INTEGRATION_SECRETS_KEY`, OIDC `OIDC_*`, `INTEGRATION_SECRETS_KEY` for tenant integration encryption.

---

## 5. Azure staging topology (Terraform)

Path: `infra/terraform/environments/staging/`

| Resource | Module | Naming pattern |
|----------|--------|----------------|
| Resource group | `resource_group` | `dora-bp-staging-rg` (via `local.name_prefix`) |
| VNet + subnets | `networking` | PostgreSQL delegated + Container Apps |
| PostgreSQL Flexible Server | `postgres` | Private; admin password in KV |
| Key Vault | `key_vault` | `database-url`, `jwt-secret-key` |
| Storage Account | `storage` | Evidence + exports containers |
| ACR | `container_registry` | Image pull via managed identity |
| Log Analytics / App Insights | `monitoring` | ACA logs |
| Container App | `compute` | `${name_prefix}-app`, ingress HTTPS |

**Bootstrap:** `infra/terraform/bootstrap/` for remote state storage (once per subscription).

**Post-apply (operator):**

1. Build/push image to ACR (`container_image` in `terraform.tfvars`).
2. `terraform apply` staging.
3. Run Alembic if not relying on container entrypoint (private DB may require VNet job).
4. Bootstrap platform operator / provision first tenant (not `seed_pilot_demo` on shared prod DB).
5. Set `cors_origins` to ACA FQDN (or custom domain).
6. Verify `/health`, `/ready`, login, evidence upload (blob + MI).

---

## 6. Frontend vs backend on Azure

**Recommended (matches repo):** Single ACA app serves API + SPA (`SERVE_FRONTEND=1`). No separate frontend deployment required.

**Optional split:** `frontend/Dockerfile` (nginx) + backend image — not used in current Terraform.

---

## 7. Health and readiness

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness (`alive`) |
| `GET /ready` | DB + Alembic schema status |

Configured as ACA HTTP probes in `infra/terraform/modules/compute/main.tf`.

---

## 8. Tests before deploy

```bash
cd backend && pytest tests/
cd ../frontend && npm run build
```

Acceptance script (demo DB only): `scripts/verify_nordhaven_demo.py`.

---

## 9. Phase checklist mapping

| Phase | Action |
|-------|--------|
| 0 | This document |
| 1 | `terraform apply` staging + isolated DB |
| 2 | `docker build -f Dockerfile.app` + run with prod-like env |
| 3 | Alembic on staging DB |
| 4 | KV secrets; document env matrix |
| 5–6 | Deploy single container to ACA; verify HTTPS/CORS/SPA |
| 7–16 | E2E, multi-tenant, security, prod cutover |

---

## 10. Known deployment gaps (fix before staging E2E)

1. **Install Azure SDK in production image** — extend `Dockerfile.app` to `pip install ".[azure]"` (or merge azure into default deps).
2. **Set `APP_ENV=production`** in Terraform `app_environment_variables` for staging/prod.
3. **Operator access:** Azure CLI + subscription; private PG requires migration path from VNet.
4. **Cloud Agent VM** used for CI-style validation has **no `az` / Docker** — staging apply must run on operator workstation or CI with Azure OIDC.

---

## 11. Can this architecture deploy directly to Azure?

**Yes**, via existing Terraform + `Dockerfile.app`, after:

- Image push to ACR,
- Minor image/env fixes above,
- Operator-run `terraform apply` and validation phases 7–16 on the staging URL.

No application redesign required.
