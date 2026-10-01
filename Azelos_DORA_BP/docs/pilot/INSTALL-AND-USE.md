# DORA Blueprint — install and use (step by step)

Operational ICT resilience / third-party risk workspace for financial entities. **Not** a compliance certification product.

---

## Part A — Install (operator or developer)

### What you need

- **PostgreSQL 16+** (local Docker, cloud, or on-prem)
- **Python 3.11+** and **Node 20+** (for building the UI unless you use the pre-built Docker image)
- **Linux/macOS/WSL** (Windows: use PowerShell scripts under `scripts/`)

### A1. Quick start with Docker (pilot)

```bash
git clone <repository-url>
cd Azelos_DORA_BP
export JWT_SECRET_KEY="$(openssl rand -hex 32)"
docker compose --profile full up --build -d
```

Wait until Postgres is healthy and the backend is up.

- **API + UI (single container):** http://127.0.0.1:8000  
- **Alternative UI via nginx:** http://127.0.0.1:5173 (proxies API to backend)

Check:

```bash
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/ready
```

### A2. Local install without Docker

```bash
cd Azelos_DORA_BP
cp .env.example .env
# Edit .env: DATABASE_URL (e.g. postgresql+psycopg://dora:dora@127.0.0.1:5432/dora_supplier_risk)

# PostgreSQL only (optional):
docker compose up -d postgres   # host port 5433 if using compose file as-is

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip && pip install -e ".[dev]"

set -a && source ../.env && set +a
python -m alembic upgrade head

cd ../frontend
npm ci && npm run build

cd ..
chmod +x scripts/start-web-one-port.sh
./scripts/start-web-one-port.sh
```

Open http://127.0.0.1:8000

### A3. Create platform operator (once per environment)

```bash
cd backend
source .venv/bin/activate
export DATABASE_URL=...   # same as app
python scripts/bootstrap_platform_operator.py \
  --email operator@your-company.example \
  --password 'YourSecurePassword12!'
```

### A4. Create customer organization

1. Login as operator → **Admin → Provision customer organization**.
2. Fill legal name, country, customer admin email, temporary password.
3. Deliver credentials securely to the customer.

### A5. Optional demo tenant (sales/training DB only)

```bash
cd backend
python scripts/seed_pilot_demo.py
```

Login: `pilot.admin@pilot-demo.example` / `PilotDemoAdmin12!`  
Verify: `python ../scripts/verify_nordhaven_demo.py`

---

## Part B — Use (customer administrator)

### B1. First login

1. Go to `/login`.
2. Enter email and password from your operator **or** use **Accept invitation** (`/accept-invite`) if you received a link.

### B2. Onboarding

1. Open **Get started** / **Onboarding**.
2. Complete **Organization profile** (type, size, regulatory status).
3. Open **Applicability** — review enabled modules (read-only; driven by profile).

### B3. Invite your team

**Team members** → email + role → send the accept-invite link.

Roles include ORG_ADMIN, RISK_MANAGER, SECURITY_MANAGER, BUSINESS_CONTINUITY_MANAGER, AUDITOR, USER.

### B4. Build the ICT chain (recommended order)

| Step | Menu | Action |
|------|------|--------|
| 1 | Providers | Add each in-scope ICT third party |
| 2 | Contracts | Link contract to provider |
| 3 | ICT services | Link service to contract; set critical/important |
| 4 | Business functions | Define internal functions |
| 5 | Dependencies | Link functions to services |
| 6 | ICT assets | Optional; link assets to functions |
| 7 | Risks | Assess provider/contract/service |
| 8 | Regulatory requirements | Set implementation status per row |
| 9 | Evidence | Upload files (document type required) |
| 10 | Incidents | Record ICT incidents |
| 11 | Resilience | Tests, BCP, DRP as needed |

### B5. Oversight views

| Goal | Where |
|------|--------|
| KPIs | **Dashboard**, **DORA overview** |
| Dependency graph | **DORA → Relationship map** |
| JSON reports | **Reports** (e.g. DORA Assessment) |
| Provider CSV | **Providers** → export |
| Change history | **Audit log** (admin) |

### B6. Logout / session

Use logout in the app. Sessions expire per server `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60); login again when prompted.

---

## Part C — Use (day-to-day roles)

- **Risk / third-party:** maintain Providers, Contracts, Services, Risks, Evidence.
- **BCM / resilience:** Incidents, resilience tests, BCP/DRP, DORA overview.
- **Compliance / DORA programme:** Requirements status, evidence coordination, reports.
- **Management:** Dashboard, relationship map, exports for committees.

Detailed task lists: [CUSTOMER-RUNBOOK.md](./CUSTOMER-RUNBOOK.md) and [customer/OPERATING.md](./customer/OPERATING.md).

---

## Part D — Operator checklist (production pilot)

See [OPERATOR-RUNBOOK.md](./OPERATOR-RUNBOOK.md): backups, restart, storage verification, tenant isolation.

---

## Part E — Known pilot limitations (expectations)

- Applicability screen is **read-only** (configure via profile).
- Reports are **JSON** in the UI, not PDF.
- **Tenant ZIP export** is via API; **provider CSV** is in the UI.
- **Evidence ↔ requirement linking** has no UI in this release (requirement status only).
- Relationship map **node positions** are session-only until reset.

Full audit: [PILOT-READINESS-AUDIT.md](./PILOT-READINESS-AUDIT.md).

---

## Part F — Help and pilot pack index

- [docs/pilot/README.md](./README.md) — all pilot documents
- Support channel defined in your pilot agreement
