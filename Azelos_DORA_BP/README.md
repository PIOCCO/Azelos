# DORA BP

**DORA BP is an operational DORA ICT resilience and third-party risk system.**

It helps financial entities **register, link, and oversee** ICT third parties, contracts, services, critical functions, assets, risks, DORA-oriented requirements, evidence, incidents, and resilience testing in **one tenant-scoped application**. Data lives in **PostgreSQL**; evidence files live in **configurable object storage** (local disk by default).

### What problem it addresses

Teams often track ICT dependencies in spreadsheets and shared folders. That makes it hard to answer operational questions such as: *Which provider supports this critical payment function? What contract covers it? What evidence do we hold? What risks are open?* DORA BP connects those registers so you can trace dependencies, review KPIs, and produce **JSON reports and CSV exports** from **your** data.

### Who it is for

- ICT / third-party risk teams  
- Business continuity and resilience teams  
- DORA / compliance programme owners (operational tracking, not legal interpretation)  
- Management oversight  
- **Platform operators** (Azelos or customer IT) who deploy the app and provision tenants  

### What it is **not**

- DORA certification or automatic DORA compliance  
- Legal advice or regulatory interpretation  
- A replacement for auditors, lawyers, or compliance professionals  
- A guarantee that data entered is accurate or complete  
- A managed SOC or incident response service  

Extended pilot materials: [docs/pilot/README.md](docs/pilot/README.md).

---

## Architecture overview

```text
Browser
   ↓
Frontend (React SPA — static build served by FastAPI or nginx)
   ↓
FastAPI (REST /api/v1, GraphQL /graphql)
   ↓
PostgreSQL 16+ (metadata, registers, relationships)
   ↓
Evidence storage (local filesystem or cloud adapter when configured)
```

| Topic | Implementation |
|--------|----------------|
| **Authentication** | Email/password → JWT (`Authorization: Bearer`). Optional OIDC when `OIDC_ENABLED=true` and issuer/client configured (`POST /api/v1/auth/oidc/token`). |
| **Tenant isolation** | Every business row is scoped by `financial_entity_id`; APIs resolve tenant from JWT `org_id`. Cross-tenant ID access returns **404** for foreign IDs. |
| **RBAC** | Role on organization membership (`SUPER_ADMIN`, `ORG_ADMIN`, …); endpoints require minimum roles. |
| **Migrations** | Alembic (`backend/alembic`); Docker entrypoint runs `alembic upgrade head` on start. |
| **Evidence** | Metadata in PostgreSQL; bytes via `STORAGE_PROVIDER` (`local` implemented; cloud adapters require config and optional SDK deps). |
| **Health** | `GET /health` — process alive (`{"status":"alive"}`). |
| **Readiness** | `GET /ready` — database connectivity + schema migration alignment. |

Repository layout (main paths):

```text
Azelos_DORA_BP/
  docker-compose.yml      # Postgres; backend+frontend with --profile full
  Dockerfile.app          # Single image: API + built UI on :8000
  .env.example            # Environment template
  backend/                # FastAPI, Alembic, scripts/
  frontend/               # React + Vite
  docs/pilot/             # Pilot runbooks and experiment templates
  scripts/start-web-one-port.sh   # Local dev: build UI + serve on :8000
```

---

## Requirements

Derived from project files (`backend/pyproject.toml`, `Dockerfile.app`, `frontend/package.json`, `docker-compose.yml`).

| Requirement | Version / note |
|-------------|----------------|
| **Docker & Docker Compose** | For recommended pilot deploy (`docker compose --profile full`) |
| **PostgreSQL** | **16+** (enforced in database contract; compose uses `postgres:16-alpine`) |
| **Python** | **≥ 3.11** (Docker image uses **3.12**) |
| **Node.js** | **20** (Docker frontend build uses `node:20-alpine`) |
| **npm** | Bundled with Node; use `npm ci` when `package-lock.json` exists |

**Ports (default compose / single-container):**

| Port | Service |
|------|---------|
| **5433** | PostgreSQL on host (`5432` inside compose network) |
| **8000** | Backend API + UI when `SERVE_FRONTEND=1` |
| **5173** | Optional nginx frontend container (`--profile full`) |

**Resources:** No hard minimum is defined in code; allow at least **2 GB RAM** for local Docker build and Postgres.

---

## Quick start — Docker

```bash
git clone <your-clone-url>
cd Azelos_DORA_BP
cp .env.example .env
```

Edit `.env` for local tools if needed. For **compose**, set secrets via shell (do not commit):

```bash
export JWT_SECRET_KEY="$(openssl rand -hex 32)"
docker compose --profile full up --build -d
```

**What starts:**

- `postgres` — always (profile default)  
- `backend` — profile `full` (API + UI on port **8000**)  
- `frontend` — profile `full` (nginx on port **5173**, proxies `/api`, `/graphql`, `/health`, `/ready`)

### Verification

| URL | Healthy meaning |
|-----|-----------------|
| http://127.0.0.1:8000/health | HTTP **200**, body like `{"status":"alive"}` |
| http://127.0.0.1:8000/ready | HTTP **200**, `"database": true`, `"schema": { "ok": true }` |

If schema is behind: `"status": "degraded"` — run migrations (`alembic upgrade head`).

### Logs, stop, restart

```bash
docker compose logs -f
docker compose --profile full stop
docker compose --profile full restart
docker compose down          # keeps volumes
```

**Do not** run `docker compose down -v` in production unless you intend to **delete PostgreSQL data** (`dora_pg_data`) and **evidence files** (`dora_evidence_data`).

Postgres-only (no app):

```bash
docker compose up -d postgres
```

---

## Environment configuration

Generate secrets securely; **never commit** real `JWT_SECRET_KEY`, database passwords, or OIDC client secrets to Git.

### Required (production pilot)

| Variable | Purpose | Example / format |
|----------|---------|------------------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql+psycopg://USER:PASS@HOST:5432/dora_supplier_risk` |
| `JWT_SECRET_KEY` | JWT signing | ≥ **32** characters when `APP_ENV=production` |

Compose also sets `DATABASE_URL` and `JWT_SECRET_KEY` on the backend service; override with `.env` or shell export.

### Required for correct browser access

| Variable | Purpose | Example |
|----------|---------|---------|
| `CORS_ORIGINS` | Allowed browser origins (comma-separated) | `http://localhost:8000,http://127.0.0.1:5173` |

### Storage (evidence files)

| Variable | Purpose | Example |
|----------|---------|---------|
| `STORAGE_PROVIDER` | Backend | `local` (default) |
| `STORAGE_LOCAL_PATH` | Directory for `local` | `./storage` or `/app/storage` in Docker |

Cloud (only if you configure and install optional deps): `azure_blob` → `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_CONTAINER`; `s3` → `S3_BUCKET`, `S3_REGION`; `s3_compatible` → `S3_ENDPOINT`, `S3_BUCKET`.

### Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| `APP_ENV` | `production` enables stricter checks | `development` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT lifetime | `60` |
| `EXPOSE_ERROR_DETAILS` | Show exception text to clients | `false` |
| `SERVE_FRONTEND` | Serve `frontend/dist` from API | `1` in Docker image |
| `GRAPHQL_INTROSPECTION_ENABLED` | GraphQL schema introspection | `true` (off in production unless set) |
| `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT`, `DB_POOL_RECYCLE` | SQLAlchemy pool | see `.env.example` |
| `DB_SSL_MODE` | PostgreSQL SSL | e.g. `require` |
| `OIDC_ENABLED` | Enable OIDC login path | `false` |
| `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` | OIDC provider | empty |
| `ALLOW_TENANT_SELF_SIGNUP` | Self-signup | `false` |

### Development / demo only

| Item | Note |
|------|------|
| `scripts/start-web-one-port.sh` | Runs `seed_dev.py` and `seed_api_user.py` — **not for production** |
| `scripts/seed_pilot_demo.py` | Fictional Nordhaven tenant — **demo DB only** |
| Default login placeholders on Login page | Dev convenience only |

Backend reads `.env` from the **current working directory** when starting uvicorn from `backend/` (Pydantic `env_file=".env"`). Copy root `.env.example` to `backend/.env` for local runs.

---

## First installation (sequence)

```text
Install
 ↓
Configure environment
 ↓
Start PostgreSQL / application
 ↓
Run migrations (automatic in Docker entrypoint)
 ↓
Bootstrap SUPER_ADMIN
 ↓
Login as operator
 ↓
Provision customer tenant
 ↓
Create / invite ORG_ADMIN
 ↓
Customer logs in
```

### 1–3. Install and start

Use **Quick start — Docker** above, or local:

```bash
cd Azelos_DORA_BP
docker compose up -d postgres
cp .env.example backend/.env
# Edit backend/.env DATABASE_URL (host port 5433 for compose postgres)
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m alembic upgrade head
cd ../frontend && npm ci && npm run build
cd ../backend && export SERVE_FRONTEND=1 && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Migrations

```bash
cd backend && python -m alembic upgrade head
```

Docker: handled by `backend/scripts/docker-entrypoint.sh`.

### 5. Bootstrap SUPER_ADMIN

```bash
cd backend
source .venv/bin/activate
export DATABASE_URL=...   # same as application
python scripts/bootstrap_platform_operator.py \
  --email operator@your-company.example \
  --password 'YourSecurePassword12!'
```

### 6–8. Provision tenant and ORG_ADMIN

1. Open the app → **Login** as operator.  
2. **Administration → Provision customer org** (`/admin/provision`).  
3. Enter organization legal name, country (ISO-2), ORG_ADMIN email, password (≥12 characters).  
4. Submit — ORG_ADMIN user and membership are created; you receive a session as that org’s admin.

Alternative: `POST /api/v1/tenant/provision` with `SUPER_ADMIN` bearer token.

To invite additional users later: ORG_ADMIN uses **Team** (`/admin/members`) → invitation link `/accept-invite?token=…`.

---

## Platform operator setup

**SUPER_ADMIN** is a **platform operator** role (tenant provisioning). It is **not** the customer’s day-to-day admin.

| Task | How |
|------|-----|
| Bootstrap | `scripts/bootstrap_platform_operator.py` |
| Login | `/login` with operator email |
| Provision tenant | `/admin/provision` or `POST /api/v1/tenant/provision` |
| Health | `/health`, `/ready` |
| Storage | Upload/download test evidence; restart app; download again |
| Auth | Login works; unauthenticated `GET /api/v1/ict-providers` → **401** |
| Isolation | With two tenants, tenant A cannot `GET` tenant B’s entity IDs (404) |

**Operators should not:**

- Routinely enter or edit customer risk/register data  
- Use customer credentials  
- Bypass tenant boundaries  
- Run demo seeds on production customer databases  

Details: [docs/pilot/OPERATOR-RUNBOOK.md](docs/pilot/OPERATOR-RUNBOOK.md).

---

## Customer onboarding (ORG_ADMIN)

### Step 1 — Accept invitation

If the operator created your account with a password, skip to Step 2.  
Otherwise open the link from **Team** → `/accept-invite?token=…`, set password (minimum **12** characters).

### Step 2 — Login

`/login` → email, password, select organization if prompted.

### Step 3 — Organization profile

**Get started** (`/onboarding`) or **Organization** (`/onboarding/profile`): organization type, size category, regulatory status, and related profile fields.

### Step 4 — DORA applicability

Open **Applicability** (`/onboarding/applicability`).  
**This screen is read-only.** Module and feature flags are computed from your **profile** (rules engine). You **review** what applies; you do **not** manually toggle applicability rows here.

### Step 5 — Invite team members

**Team** (`/admin/members`) — roles implemented:

| Role | Purpose |
|------|---------|
| `ORG_ADMIN` | Organization administration, invitations, tenant export (API) |
| `RISK_MANAGER` | Risk and provider workflows (API minimum roles) |
| `SECURITY_MANAGER` | e.g. creating ICT providers (API) |
| `BUSINESS_CONTINUITY_MANAGER` | BCM/resilience workflows |
| `AUDITOR` | Read-oriented access |
| `USER` | General user |
| `SUPER_ADMIN` | Platform operator only (provision tenants) |

Navigation hides some items unless your role and module applicability allow access.

---

## DORA operational workflow (mental model)

**Core chain:**

```text
Provider
   ↓
Contract
   ↓
ICT Service
   ↓
Business Function  (via Dependencies)
   ↓
Asset
   ↓
Risk
   ↓
Requirement
   ↓
Evidence
```

**Resilience & oversight:**

```text
Incidents
Resilience tests / BCP / DR / TLPT (as enabled)
      ↓
Dashboard & DORA Overview
Relationship Map
Reports (JSON)
Exports (CSV / API ZIP)
```

Relationships matter because DORA oversight is about **traceability**: from a critical function to the ICT services and providers that support it, the risks recorded, requirements tracked, and evidence held.

---

## Providers

**UI:** **DORA → ICT Third-Party Providers** (`/ict-providers`).

**Create (UI):** Legal name, country code (2 letters). Optional API fields: trading name, LEI.

**Example (fictional):** Legal name `PaymentClear EU B.V.`, country `IE`.

Providers appear in contracts, risks, evidence, relationship map, and provider CSV export.

**API:** `POST /api/v1/ict-providers` (minimum role `SECURITY_MANAGER`; ORG_ADMIN satisfies this).

---

## Contracts

**UI:** **DORA → Contracts** (`/contracts`).

**Create (UI):** Select provider, reference number, start date; contract type defaults to **outsourcing** in the form. Status and end date can be updated on the detail page.

**Creation is fully available in the UI** (not API-only).

Contracts link one provider to one or more ICT services.

---

## ICT services

**UI:** **DORA → ICT Services** (`/ict-services`).

Represents a service delivered under a **contract** (e.g. payment processing, cloud hosting). Set classification / critical-or-important flags in the UI detail form. Link to business functions via **Dependencies**.

---

## Business functions

**UI:** **Organization → Business functions** (`/business-functions`).

Define internal functions (e.g. retail payments). Mark **critical / important / neither**. Link to ICT services on **Dependencies** (`/dependencies`).

---

## ICT assets

**UI:** **DORA → ICT assets** (`/ict-assets`) and **Information assets** (`/information-assets`).

ICT assets can reference information assets and link to business functions (asset–function mapping). Used in risk and resilience context and in the relationship graph where linked.

---

## Risk management

**UI:** **DORA → ICT Risk Management** (`/risks`).

**Create:** Select at least one target (UI: provider; API also allows contract/service). Enter eight dimensions (`very_low` … `very_high`): criticality, data_sensitivity, substitutability, concentration_risk, geographic_risk, security_assurance, contract_gaps, exit_feasibility. Assessor is taken from your login email. The system calculates **resulting_risk_level** (calculation version stored on the assessment).

**Important:** You supply judgements and rationale; the BP **does not** replace professional risk assessment.

---

## Requirements

**UI:** **Compliance → Regulatory requirements** (`/requirements`).

- **Baseline catalogue** (left): read-only DORA reference requirements from migrated seed data.  
- **Organization implementation** (right): per-organization rows created at tenant provision.

**Statuses in UI:** `not_started`, `in_progress`, `implemented`, `not_applicable`.

These statuses are **your organization’s operational tracking**. Marking a row `implemented` does **not** mean legal or regulatory compliance is achieved.

---

## Evidence

**UI:** **Compliance → Evidence** (`/evidence`).

- Choose **document type** (from reference data).  
- Upload file → metadata in PostgreSQL, bytes in configured storage.  
- Download from the list (authenticated).

**Limitation:** Linking evidence to a requirement is available via API `POST /api/v1/evidence-links/requirements` (ORG_ADMIN). There is **no dedicated UI** for that link in this release. Linking evidence to contract controls uses `POST /api/v1/evidence-links/controls` (SECURITY_MANAGER).

---

## Incidents

**UI:** **DORA → Incidents** (`/incidents`).

Create incidents with title, severity, status lifecycle fields, and links to related entities where supported on the detail flow. This is an **operational register** — not automated regulatory incident reporting.

---

## Resilience testing

**UI (module-gated):**

- **Resilience → Resilience testing** (`/resilience-tests`) — campaigns (kinds include scenario, business_continuity, disaster_recovery, penetration_test, tlpt).  
- **Business continuity** (`/business-continuity`)  
- **Disaster recovery** (`/disaster-recovery`)  
- **DORA → TLPT** (`/tlpt`)  
- **Resilience** hub, **Findings**, **Remediation**, **Recovery tests**, **Resilience evidence** — cloud/resilience platform pages where populated  

Record tests and plans with the forms provided; only fields exposed in the UI/API exist.

---

## Relationship map

**UI:** **DORA → Relationship map** (`/dora/relationship-map`).

Graph built from **your** linked entities (GraphQL `organizationGraph`). Pan and zoom; drag nodes to rearrange.

**Limitation:** **Graph layout changes are session-only** and are **not** persisted across sessions or browsers (reset clears manual positions).

---

## Dashboard

**UI:** **Dashboard** (`/`).

All KPIs are computed from **your organization’s stored data** — not an independent regulatory score.

| Metric | Source (conceptually) |
|--------|------------------------|
| Critical services, services with gaps, high findings, cloud resources, open remediations | Resilience dashboard API |
| ICT providers, ICT assets, risks (count), business functions, incidents | Paginated API totals |
| Requirement implementation chart | Organization requirements (`implemented` / partial string match / other) |
| Enabled modules | Applicability modules |
| Action center | Risk count, applicability requirement hints |

Empty dashboard means **no data entered yet**, not a system failure.

**DORA Overview** (`/dora/overview`): additional KPIs (providers, assets, functions, risks, incidents, BCP/DR counts, evidence expiring, etc.) from `/api/v1/dora/overview`.

---

## Reports

**UI:** **Resilience platform → Reports** (`/reports`).

Reports are **JSON** displayed in the browser (not PDF).

| Report key | Label in UI |
|------------|-------------|
| `business-resilience` | Business Resilience Report |
| `dora-assessment` | DORA Assessment Report |
| `cloud-gap` | Cloud Resilience Gap Report |
| `remediation` | Remediation Report |
| `recovery-testing` | Recovery Testing Report |

Generate by clicking the report button; use JSON for oversight meetings or downstream tooling.

---

## Exports

### UI exports

| Export | Where |
|--------|--------|
| **ICT providers CSV** | **ICT Third-Party Providers** page — export/download control |

### API exports

| Export | Endpoint | Role |
|--------|----------|------|
| **Tenant ZIP** | `GET /api/v1/tenant/data/export` | `ORG_ADMIN` |

There is **no** main-menu button for tenant ZIP; use API with bearer token (e.g. curl) or operator-assisted export.

---

## User roles and permissions

| Role | Purpose | Main capabilities |
|------|---------|-------------------|
| `SUPER_ADMIN` | Platform operator | Provision tenants (`/admin/provision`), not customer data ownership |
| `ORG_ADMIN` | Customer admin | Profile, team invites, configuration pages, tenant ZIP export |
| `RISK_MANAGER` | Risk / third-party | Risk and related registers (per route rules) |
| `SECURITY_MANAGER` | Security / providers | Create providers, some evidence-control links |
| `BUSINESS_CONTINUITY_MANAGER` | BCM | Incidents, resilience modules |
| `AUDITOR` | Oversight | Read-oriented access |
| `USER` | General | Default invited user |

Exact menu visibility also depends on **module applicability** flags.

---

## Authentication and security

- Passwords hashed (passlib); login via `POST /api/v1/auth/login`.  
- JWT in `Authorization: Bearer`; includes user and `org_id`.  
- Session expiry: `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60). Frontend clears session on **401**.  
- **Tenant isolation:** JWT org scope; do not trust client-supplied tenant IDs over the token.  
- **Production:** set `APP_ENV=production`, strong `JWT_SECRET_KEY`, restrict `CORS_ORIGINS`, `EXPOSE_ERROR_DETAILS=false`.  
- Protect: DB credentials, JWT secret, evidence storage, backups, operator accounts.

---

## Backup and recovery

| Responsibility | Owner |
|----------------|--------|
| PostgreSQL backups, PITR, encryption | **Customer / operator infrastructure** |
| Evidence file or bucket backup | **Customer / operator infrastructure** |
| Application migrations, health endpoints | **DORA BP software** |
| Full DR service | **Not provided by the BP** |

Include Docker volumes **`dora_pg_data`** and **`dora_evidence_data`** in backup strategy. Test restore before relying on it.

---

## Production deployment

| Component | Supplied by BP | Supplied by customer/operator |
|-----------|----------------|-------------------------------|
| Application container / binaries | Yes | Host or K8s/ACA to run it |
| PostgreSQL | No | Yes |
| TLS / reverse proxy | No | Yes (nginx, Traefik, App Gateway, …) |
| Evidence storage | Logic + local adapter | Disk volume or cloud bucket |
| Secrets management | Env vars | Vault / platform secrets |
| Monitoring | `/health`, `/ready` | Log aggregation, alerts |

- Set `APP_ENV=production`, `JWT_SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, storage paths.  
- Run migrations on deploy (Docker entrypoint or CI job).  
- Prefer single origin: either **:8000** with `SERVE_FRONTEND=1` or **:5173** nginx proxying to backend.  
- Point health checks to `/ready`.

More detail: [docs/pilot/customer/DEPLOYMENT.md](docs/pilot/customer/DEPLOYMENT.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Troubleshooting

### Application unavailable

- `curl http://127.0.0.1:8000/health`  
- `curl http://127.0.0.1:8000/ready`  
- `docker compose ps`  
- `docker compose logs backend`

### Database unavailable

- Check Postgres running; `DATABASE_URL` host/port (compose: `postgres:5432` inside network, `127.0.0.1:5433` from host).  
- `/ready` shows `"database": false` or errors when DB is down.

### Authentication problems

- Verify email/password; password ≥12 on invite.  
- Wrong organization membership → 403 on login with wrong `organization_id`.  
- Expired JWT → login again.

### Evidence upload/download failures

- Check `STORAGE_LOCAL_PATH` exists and is writable.  
- Docker: ensure `dora_evidence_data` volume mounted.  
- After container recreate without volume, metadata may exist but files missing.

### Empty dashboard

- Expected until you create providers, functions, risks, etc.

### Tenant access problem

- Users must not see other tenants’ data; foreign IDs should **404**. If not, treat as a security incident and contact support.

---

## Demo environment

**Fictional tenant:** **Nordhaven Mutual Bank AG (Pilot Demo)**.

```bash
cd backend
source .venv/bin/activate
export DATABASE_URL=...
python scripts/seed_pilot_demo.py
python ../scripts/verify_nordhaven_demo.py
```

| Field | Demo value (rotate in shared environments) |
|-------|---------------------------------------------|
| Email | `pilot.admin@pilot-demo.example` |
| Password | `PilotDemoAdmin12!` |

Use **only** on demo/training databases. **Never** use demo credentials or seed scripts in production customer environments.

Walkthrough: [docs/pilot/DEMO-SCENARIO.md](docs/pilot/DEMO-SCENARIO.md).

**Note:** `scripts/start-web-one-port.sh` seeds **Demo European Bank** (`admin@demo.bank` / `ChangeMeNow!`) — separate dev demo, not Nordhaven.

---

## From zero to your first DORA record

1. **Login** as ORG_ADMIN.  
2. **Organization profile** — complete onboarding.  
3. **Applicability** — review read-only flags.  
4. **Create provider** — e.g. fictional `Acme ICT Services GmbH`, `DE`.  
5. **Create contract** — link to provider, reference `ICT-2026-001`, start date.  
6. **Create ICT service** — link to contract.  
7. **Create business function** — mark critical if applicable.  
8. **Dependencies** — link function to service.  
9. **Create ICT asset** (optional).  
10. **Create risk** — select provider, set dimensions.  
11. **Requirements** — set one row to `in_progress`.  
12. **Evidence** — upload a file.  
13. **Incident** or **resilience test** (optional).  
14. **Relationship map** — confirm nodes appear.  
15. **Dashboard** / **DORA overview** — counts update.  
16. **Reports** — run DORA Assessment (JSON).  
17. **Export** — providers CSV from Providers page.

---

## Current limitations

- **Applicability** is read-only in UI; driven by organization profile.  
- **Reports** are JSON in the UI, not PDF.  
- **Tenant ZIP export** via API only (`ORG_ADMIN`), not main UI.  
- **Evidence ↔ requirement linking** via API only (`POST /api/v1/evidence-links/requirements`); no UI workflow.  
- **Relationship map** node positions are session-only.  
- **OIDC** is optional (`OIDC_ENABLED=false` by default); pilot path is email/password.  
- **Cloud evidence storage** (`azure_blob`, `s3`, `s3_compatible`) requires configuration and optional Python extras; verify before contractual commitments.  
- **Docker compose full stack** should be smoke-tested in your environment before go-live.

---

## Customer responsibilities

You remain responsible for: accuracy of data; regulatory and legal interpretation; contracts with providers; risk acceptance; incident decisions; resilience strategy; infrastructure security; backups; access management; and regulatory communications. The BP is an **operational system of record**, not professional judgement.

Boundary table: [docs/pilot/PILOT-BOUNDARY.md](docs/pilot/PILOT-BOUNDARY.md).

---

## Security checklist (deployment)

```text
[ ] Strong JWT secret configured (≥32 chars in production)
[ ] Production secrets not committed to Git
[ ] TLS configured in front of the application
[ ] Database network restricted and credentials rotated
[ ] Evidence storage protected (volume permissions or private bucket)
[ ] Backups configured for PostgreSQL and evidence storage
[ ] Restore procedure tested once
[ ] Operator and ORG_ADMIN accounts protected (strong passwords)
[ ] Least privilege for DB and storage IAM
[ ] Tenant isolation verified (two-tenant IDOR check)
[ ] Logs monitored
[ ] /health and /ready monitored
```

---

## Pilot workflow

```text
INSTALL
  ↓
CONFIGURE
  ↓
BOOTSTRAP OPERATOR
  ↓
CREATE TENANT
  ↓
CREATE ORG_ADMIN
  ↓
CUSTOMER ONBOARDING
  ↓
ENTER REAL DATA
  ↓
TRACE CRITICAL SERVICES
  ↓
MANAGE RISKS / REQUIREMENTS / EVIDENCE
  ↓
REVIEW RESILIENCE
  ↓
REPORT
  ↓
EXPORT
  ↓
PILOT FEEDBACK
```

Experiment templates: [docs/pilot/PILOT-EXPERIMENT.md](docs/pilot/PILOT-EXPERIMENT.md), [docs/pilot/BASELINE-MEASUREMENT.md](docs/pilot/BASELINE-MEASUREMENT.md).

---

## Development and tests

```bash
cd backend && source .venv/bin/activate && pip install -e ".[dev]"
export DATABASE_URL=...
python -m alembic upgrade head
pytest
cd ../frontend && npm ci && npm test && npm run build
```

API docs (development): `/docs` (OpenAPI). GraphQL: `/graphql` (authenticated queries).

---

## Further documentation

| Document | Audience |
|----------|----------|
| [docs/pilot/INSTALL-AND-USE.md](docs/pilot/INSTALL-AND-USE.md) | Shorter install guide (superseded in detail by this README) |
| [docs/pilot/OPERATOR-RUNBOOK.md](docs/pilot/OPERATOR-RUNBOOK.md) | Operator procedures |
| [docs/pilot/CUSTOMER-RUNBOOK.md](docs/pilot/CUSTOMER-RUNBOOK.md) | Customer task list |
| [docs/DATABASE-CONTRACT.md](docs/DATABASE-CONTRACT.md) | PostgreSQL expectations |
| [docs/STORAGE-ARCHITECTURE.md](docs/STORAGE-ARCHITECTURE.md) | Evidence storage design |
