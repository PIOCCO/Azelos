# Customer-hosted ADORA — deployment validation report

**Purpose:** Confirm ADORA can run in the **customer’s Azure** with a **dedicated PostgreSQL** database—without access to the customer’s existing corporate database or mandatory Azelos SaaS connectivity.

**Validated in repo:** October 2026 (automated tests + config inspection; full Azure E2E not run in agent VM—no Docker daemon).

---

## 1. Architecture (as implemented)

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, SQLAlchemy 2.x, Alembic, psycopg 3 |
| **Frontend** | React + Vite (built into `Dockerfile.app`, served with `SERVE_FRONTEND=1`) |
| **Database** | Customer-provided **PostgreSQL 16+**; single `DATABASE_URL` |
| **Auth / RBAC** | JWT; roles (`ORG_ADMIN`, `RISK_MANAGER`, …); `financial_entity_id` tenant isolation |
| **Licensing** | Ed25519 signed envelope; `organization_licenses`; middleware enforcement |
| **IaC** | `infra/terraform/` → RG, PostgreSQL Flexible Server, Key Vault, Storage, Container Apps, optional ACR |
| **Secrets** | `DATABASE_URL`, `JWT_SECRET_KEY` via Key Vault → Container App secrets (or inline in dev express mode) |

ADORA does **not** connect to any database except the one configured in `DATABASE_URL`. Optional **Integrations** UI can test an external PostgreSQL/API **only if the customer configures it**—not required for deployment.

---

## 2. Dedicated PostgreSQL + schema

**Customer action:** Create (or let Terraform create) a **new** PostgreSQL server/database for ADORA only.

**Application action:** Creates/updates schema via Alembic—customer does **not** hand-create tables.

| Mechanism | Location |
|-----------|----------|
| Migrations | `backend/alembic/versions/` (head: `014_organization_licenses`) |
| Container startup | `backend/scripts/docker-entrypoint.sh` → `python -m alembic upgrade head` |
| App startup (non-Docker) | `AUTO_MIGRATE_DB=1` default in non-production (`app/main.py`) |
| Readiness | `GET /ready` checks DB + migration head alignment |

**Verified:** `alembic upgrade head` succeeds on configured test database; `alembic current` → `014_organization_licenses (head)`.

All ADORA registers (organizations, providers, contracts, evidence metadata, licensing, audit, etc.) live in this **one** application database—no duplicate schema design.

---

## 3. Database credentials (recommended)

| Practice | Implementation |
|----------|----------------|
| Dedicated DB | Terraform `azurerm_postgresql_flexible_server_database.app` |
| Dedicated user | Connection string uses server admin or a scoped app role (customer may create least-privilege role post-deploy) |
| TLS | `sslmode=require` in Terraform-generated `DATABASE_URL`; `DB_SSL_MODE=require` on app |
| Secret store | Key Vault secrets `database-url`, `jwt-secret-key` → Container App secret refs (VNet-integrated stack) |
| Injection | Container env `DATABASE_URL` / `JWT_SECRET_KEY` from secrets—not in source or image |

Customer retains ownership of server, backups, firewall/VNet, and credentials.

---

## 4. Customer delivery package (no source code)

| ADORA / Azelos provides | Customer receives |
|-------------------------|-------------------|
| **Container image** | Pull from customer ACR, Docker Hub, or signed tarball—**not** application source |
| **IaC** | `infra/terraform/` (customer runs in their subscription) |
| **Migrations** | Inside image (`/app/alembic`) |
| **Runbooks** | `docs/pilot/OPERATOR-RUNBOOK.md`, `docs/pilot/customer/DEPLOYMENT.md`, `docs/licensing/README.md` |
| **Signed license** | JSON envelope for `organization_id` |
| **Production public key** | Out-of-band PEM or `ADORA_LICENSE_PUBLIC_KEY_FILE` mount—**override** bundled dev `public_key.pem` in production |

**Must NOT ship to customer:** `ADORA_LICENSE_SIGNING_KEY_*`, dev license seeds, Azelos operator passwords, internal `.env` files.

---

## 5. License (customer-hosted)

| Variable | Purpose |
|----------|---------|
| `ADORA_LICENSE` or `ADORA_LICENSE_FILE` | Signed envelope; bootstrap on startup |
| `ADORA_LICENSE_PUBLIC_KEY_FILE` | **Production** verification key (recommended) |
| `ADORA_LICENSE_ENFORCEMENT` | `1` in production (default when `APP_ENV=production`) |
| UI | Settings → Software license (install/renew after ORG exists) |

Signing scripts (`backend/scripts/licensing/sign_license.py`) run **only** on Azelos licensing infrastructure.

---

## 6. Evidence storage

| Mode | When | Customer provisions |
|------|------|---------------------|
| **`local`** | Pilot / compose | Volume mount (e.g. `dora_evidence_data` → `/app/storage`) |
| **`azure_blob`** | Terraform default `storage_provider` | Storage account + container; MI **Storage Blob Data Contributor** on app identity; `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_CONTAINER` |

Metadata in PostgreSQL; bytes in configured backend (`app/storage/factory.py`).

**Production note:** Express/dev Terraform may use `/tmp/evidence` for `local`—**not durable** on Container Apps. For paid pilot, use **`azure_blob`** with customer storage account or mount persistent volume (not fully automated in current Terraform for local).

**Image:** `Dockerfile.app` installs `.[dev,azure]` so `azure_blob` works when Terraform sets blob storage.

---

## 7. Deployment flow (realistic)

1. Customer: subscription + resource group.
2. Customer/Azelos: `terraform apply` (or manual PG + Container App).
3. PostgreSQL Flexible Server + **empty** database created.
4. Storage account (if `azure_blob`).
5. Key Vault secrets: `database-url`, `jwt-secret-key`; optional license secret.
6. Deploy Container App image (`Dockerfile.app`).
7. Entrypoint: **Alembic upgrade head**.
8. App starts; `/health`, `/ready`.
9. Install license (`ADORA_LICENSE*` and/or UI after provision).
10. `bootstrap_platform_operator.py` → SUPER_ADMIN (operator-only).
11. `POST /api/v1/tenant/provision` or UI → tenant + ORG_ADMIN.
12. Customer login, profile, registers, evidence, exports.
13. Expired license → read-only (verified by licensing tests).

**No step requires corporate database access or Azelos phone-home.**

---

## 8. Data ownership (technical)

| Asset | Owner |
|-------|--------|
| PostgreSQL server & backups | Customer |
| Rows in ADORA database | Customer |
| Evidence blobs | Customer (their storage account or volume) |
| Azure resources | Customer |
| ADORA software / container image | Azelos (licensed use) |
| Source code | Azelos (not part of default delivery) |

---

## 9. Import / migration of business data

Explicit customer-provided imports only:

- **CSV:** `POST /api/v1/import/ict-providers.csv` (and provider list CSV export pattern).
- **UI/API:** Manual create for contracts, services, etc.
- **No** automatic connector to corporate PostgreSQL unless customer optionally configures Integrations (test connection)—out of scope for baseline deploy.

---

## 10. Security review (repository scan)

| Check | Result |
|-------|--------|
| Private license signing key in git/image | **Not found** (env-only loader) |
| Dev public key in image | **Present** (`app/licensing/public_key.pem`)—override in production |
| Hardcoded prod passwords in Terraform | Passwords from `random_password` → Key Vault |
| `DATABASE_URL` in frontend | **No** |
| License bypass frontend-only | **No**—`LicenseEnforcementMiddleware` on API mutations |
| Mandatory phone-home | **No** licensing callback |
| Compose dev passwords | `dora/dora` **dev only**—not production pattern |

---

## 11. Deployment checklist

### Customer must provide

- [ ] Azure subscription & resource group  
- [ ] Decision: Terraform stack vs manual ACA + PG  
- [ ] PostgreSQL 16+ (Flexible Server recommended) + **dedicated database name**  
- [ ] DB connectivity (private endpoint or controlled firewall) + TLS  
- [ ] Key Vault (or equivalent) for `DATABASE_URL`, `JWT_SECRET_KEY`  
- [ ] Storage account + container if using `azure_blob`  
- [ ] Container registry access (ACR/Docker Hub) for image pull  
- [ ] DNS/TLS front door if custom domain  
- [ ] Signed **production** license + production **public key**  
- [ ] CORS origin(s) for browser URL  
- [ ] Optional: time-boxed Contributor for implementer (not standing Azelos admin)

### ADORA / Azelos provides

- [ ] Container image (built from `Dockerfile.app`)  
- [ ] Terraform modules + environment examples  
- [ ] Alembic migrations (in image)  
- [ ] Documentation (`docs/DEPLOYMENT.md`, pilot customer docs, licensing)  
- [ ] Signed license file  
- [ ] Production Ed25519 public key  
- [ ] Implementation/onboarding runbook  

### Customer does **not** need to provide

- [ ] Access to existing corporate PostgreSQL  
- [ ] Source code repository access  
- [ ] ADORA signing private key  
- [ ] Permanent Azelos subscription-owner access  
- [ ] Mandatory SaaS connection to Azelos  

---

## 12. Validation run (this environment)

| Check | Result |
|-------|--------|
| Backend `pytest` | **145 passed** |
| Frontend `npm run build` | **OK** |
| `alembic heads` / `upgrade head` | **OK** (head `014_organization_licenses`) |
| `docker build -f Dockerfile.app` | **Not run** (no Docker in agent VM) |
| Full Azure Terraform apply + smoke | **Not run** (documented separately; known ACR/Entra friction) |

---

## 13. Readiness for first paid customer-hosted pilot

**Architecturally ready:** Yes—dedicated PG, Alembic, tenant model, licensing, and customer-owned Azure align with the commercial model.

**Operational blockers (non-code):**

1. One documented **successful** customer-like Azure deploy + `/ready` + login + provision + license + evidence upload smoke.  
2. Production license **public key** override documented on every deploy.  
3. **Evidence durability** choice explicit (`azure_blob` + MI, or persistent volume)—avoid `/tmp/evidence` for paid pilot.  
4. Legal: MSA/DPA/SOW (commercial package).  

**Minor code fix applied:** `Dockerfile.app` now installs `.[azure]` so Terraform-default blob storage works in the container image.

---

## Key file references

| Topic | Path |
|-------|------|
| Single-container image | `Dockerfile.app` |
| Migrations on start | `backend/scripts/docker-entrypoint.sh` |
| DB config | `backend/app/config/database.py` |
| Terraform platform | `infra/terraform/modules/platform/main.tf` |
| License | `docs/licensing/README.md`, `backend/app/licensing/` |
| Operator bootstrap | `backend/scripts/bootstrap_platform_operator.py` |
| Customer env vars | `docs/pilot/customer/DEPLOYMENT.md`, `.env.example` |
