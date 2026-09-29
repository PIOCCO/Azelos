# FastAPI implementation plan (as-built vs target)

## Repository inspection (actual state)

| Item | Status |
|------|--------|
| FastAPI | Partial — `app/api/main.py` + config routes only |
| ORM | SQLAlchemy 2.x (not SQLModel) |
| DB config | `app/config/database.py` + `app/database/engine.py` |
| Alembic | Yes, revisions through `005_config_reference_data` |
| Auth / users | **Missing** — header MVP only on config routes |
| RBAC | **Missing** |
| Repositories | **Missing** |
| v1 API prefix | **Missing** |
| Frontend | None in this folder |
| Physical PG schemas | Tables in `public`; logical split documented below |

## Target vs incremental delivery

**Target architecture** uses PostgreSQL schemas `dora_core`, `dora_config`, `client_extensions`.

**This increment:**

1. Creates schemas + `client_extensions.extension_registrations` (no mass `ALTER` of existing tables — preserves deployed DBs).
2. Sets `search_path` on connect for forward-compatible schema layout.
3. Implements full **FastAPI v1** layer: auth, RBAC, repositories, services, core CRUD for **existing** models.
4. Stubs module-gated endpoints for entities not yet in DB (ICT assets, incidents, BCP, DR, resilience tests).
5. Migrates configuration API under `/api/v1/config/*`.
6. Adds `/health`, `/ready`, `/api/v1/database/*`.

**Organization** = `financial_entities.id`. **Suppliers** = `ict_providers`.

## Layering

```text
Router → Service → Repository → SQLAlchemy → PostgreSQL
```
