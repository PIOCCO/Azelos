# Phase 0 — Repository Analysis (DORA Supplier Risk Blueprint)

## 1. What already exists

| Area | Finding |
|------|---------|
| **Repository root** | Monorepo wrapper `azelos` (`package.json`) for the **APIO** Moroccan real-estate marketplace in `maisonmaroc/`. |
| **Backend** | Node.js/Express API in `maisonmaroc/server/` — SQLite via `src/db.js`, custom SQL migrations in `src/migrate.js`. |
| **Frontend** | React + TypeScript + Vite in `maisonmaroc/src/` (out of scope for this MVP). |
| **Docker** | `maisonmaroc/deploy/docker-compose.apio.yml` — APIO Node containers only; **no PostgreSQL** for this app. |
| **Environment** | `maisonmaroc/server/.env.example` — SQLite paths, auth secrets; no `DATABASE_URL` for Postgres. |
| **Python / FastAPI** | **Not present** in the current branch checkout. |
| **SQLAlchemy / Alembic** | **Not present**. |
| **DORA / supplier risk** | **Not present**; remote branch `cursor/bcdr-cloud-blueprint-7167` is BCDR/Terraform documentation, not this relational model. |
| **Azelos_DORA_BP** | **Does not exist** — greenfield folder required (per task). |

**Conclusion:** No existing DORA database code to overwrite. All work is isolated under `Azelos_DORA_BP/` without modifying APIO marketplace behaviour.

## 2. What is missing

- PostgreSQL as source of truth for DORA supplier risk
- SQLAlchemy 2.x ORM models for the 12 core entities (+ minimal reference/junction tables)
- Alembic migration chain (no `create_all()` in production path)
- Development Docker Compose for PostgreSQL
- Seed data for concentration / subcontractor / CIF testing
- Integration tests for constraints and tenant paths
- `docs/dora-roi-mapping.md` (internal model vs RoI export layer)

**Explicitly not built in this phase:** Azure, Terraform, GraphQL, React UI, RoI template tables, OpenAI, CI/CD.

## 3. Files to be created (new tree)

```
Azelos_DORA_BP/
├── README.md
├── .env.example
├── docker-compose.yml
├── docs/
│   ├── PHASE0-ANALYSIS.md          (this file)
│   └── dora-roi-mapping.md
├── backend/
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/001_initial_schema.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── enums.py
│   │       ├── financial_entity.py
│   │       ├── provider.py
│   │       ├── contract.py
│   │       ├── service.py
│   │       ├── business_function.py
│   │       ├── subcontractor.py
│   │       ├── risk.py
│   │       ├── evidence.py
│   │       ├── dora_control.py
│   │       ├── exit_strategy.py
│   │       └── audit.py
│   ├── scripts/
│   │   └── seed_dev.py
│   └── tests/
│       ├── conftest.py
│       └── test_database_integrity.py
```

## 4. Files to be modified

| File | Change |
|------|--------|
| *(none in `maisonmaroc/`)* | Marketplace code remains untouched. |
| Root `README.md` | Optional one-line pointer to `Azelos_DORA_BP/` (only if product owner wants monorepo discovery). **Not modified** unless requested — keeps scope minimal. |

## 5. Why each database entity is required

| Entity | Purpose |
|--------|---------|
| **FinancialEntity** | Tenant anchor for multi-institution deployment; all sensitive rows trace ownership via `financial_entity_id`. |
| **ICTProvider** | DORA third-party ICT supplier register (LEI, country, status) per institution. |
| **Contract** | Legal agreement linking institution and provider; expiry, notice, governing law for risk and RoI. |
| **ICTService** | Granular ICT dependency under a contract (classification, location, CIF support flag). |
| **BusinessFunction** | Internal C/I functions (payments, etc.) that must be mapped to ICT services for concentration analysis. |
| **FunctionServiceMapping** | Many-to-many dependency graph without duplicating FKs on both sides. |
| **Subcontractor** | Self-referencing chain for nth-party/sub-outsourcing (recursive CTEs, shared sub-provider concentration). |
| **RiskAssessment** | Append-only assessment history with **inputs** preserved, not only a score. |
| **Evidence** | Document metadata (blob URI, hash, expiry) — files stay in object storage later. |
| **DORAControl** (+ contract mapping) | Contractual control catalogue and per-contract compliance with human review states. |
| **ExitStrategy** | C/I exit planning linked across function → service → contract → provider. |
| **AuditRecord** | DB-persisted audit trail independent of application logs. |

**Supporting (minimal):**

- **ServiceClassification** — configurable DORA service taxonomy (avoids hard-coded enums).
- **DocumentType** — controlled evidence types.
- **EvidenceControlLink** — one evidence item supporting multiple controls.

## 6. Design notes (Phases 13–15 preview)

- **Tenant isolation:** Composite foreign keys `(id, financial_entity_id)` on provider-linked rows where needed; future RLS on `financial_entity_id`.
- **Integrity:** CHECK for ISO country, LEI shape, date ranges, controlled status enums.
- **Indexes:** Aligned to lookup by LEI, names, contract reference, FK join paths, evidence/contract expiry, audit `(entity_type, entity_id)`.

Implementation proceeds in `Azelos_DORA_BP/backend/` per Phases 1–20.
