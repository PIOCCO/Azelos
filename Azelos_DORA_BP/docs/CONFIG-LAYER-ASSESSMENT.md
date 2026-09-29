# Architecture assessment — configuration / metadata layer

**Date:** Before config-layer implementation  
**Scope:** `Azelos_DORA_BP/` (DORA **Supplier Risk** Blueprint)

## 1. What exists today

| Area | Finding |
|------|---------|
| **PostgreSQL** | 16+ target; Alembic migrations `774dec1bcf90` → `003_evidence_storage_neutral` |
| **ORM** | SQLAlchemy 2.x typed models under `app/models/` |
| **Tenant** | `financial_entities` + `financial_entity_id` on domain rows (composite FKs) |
| **Core DORA supplier domain** | Providers, contracts, services, business functions, subcontractors, risk assessments, evidence, contract controls, exit strategies, audit records |
| **Regulatory catalogue (partial baseline)** | `dora_control_definitions` (immutable codes); per-org **implementation** in `contract_dora_controls` |
| **Users / auth** | **Not implemented** (no users table) |
| **HTTP API** | **Not implemented** (this task adds minimal FastAPI for configuration) |
| **Frontend** | **Not in this folder** (API-first; admin UI deferred) |
| **Tests** | 29 pytest integration tests (schema + portability + storage) |

## 2. What does *not* exist (Business Resilience full catalogue)

Entities such as `ict_assets`, `bcp_plans`, `dr_plans`, `incidents` are **out of scope** for the current codebase. Custom fields apply to **existing** entity types via an allowlist (e.g. `ict_provider`, `contract`, `ict_service`, `business_function`).

## 3. Design decisions for this increment

| Decision | Rationale |
|----------|-----------|
| **Organization = `financial_entities.id`** | Reuse tenant boundary; API uses `/organizations/{id}` where `id` is financial entity UUID |
| **No dynamic DDL** | All customization via metadata tables + JSONB values |
| **`platform_modules`** | System-defined module catalogue; orgs enable subsets via FK |
| **`dora_domains` / `dora_requirements`** | Immutable regulatory baseline rows (seeded, not user-deletable) |
| **`organization_requirements`** | Org-specific applicability and status |
| **Separate `configuration_audit_log`** | Config changes auditable without overloading `audit_records` |
| **FastAPI config API** | Header-based admin gate for MVP (`X-Organization-Id`, `X-User-Role`) |

## 4. Files to add (summary)

- Models: `app/models/platform_config.py`, `app/models/custom_fields.py`, `app/models/dora_baseline.py`
- Services: `app/services/custom_field_validation.py`, `app/services/config_audit.py`
- API: `app/api/main.py`, `app/api/deps.py`, `app/api/routes/config.py`
- Migration: `004_configuration_metadata_layer.py`
- Tests: `tests/test_config_layer.py`, `tests/test_api_config.py`
- Docs: regulatory baseline, modules, custom fields

## 5. Backward compatibility

- No changes to existing migration files
- Existing tables and seed data unchanged
- New tables only; optional seed enables default modules for Demo European Bank
