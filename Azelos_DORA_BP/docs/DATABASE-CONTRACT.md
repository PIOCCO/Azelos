# PostgreSQL database contract

## Standardized engine

| Item | Value |
|------|--------|
| Database engine | **PostgreSQL** |
| Supported version | **16+** |
| Driver | **psycopg** (v3) |
| ORM | **SQLAlchemy 2.x** |
| Schema migrations | **Alembic** (`alembic upgrade head`) |

> **PostgreSQL is standardized; hosting is flexible.**

The Blueprint does **not** support MySQL, SQL Server, Oracle, MongoDB, or other engines.

## Connection

All runtime and migration tooling reads **`DATABASE_URL`** from the environment:

```env
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
```

Optional pool and TLS settings:

```env
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800
DB_SSL_MODE=require
```

No hostname, cloud vendor, or credentials are hard-coded in application code.

## Installation flow

```text
Client provides PostgreSQL
        ↓
Configure DATABASE_URL (+ optional pool/SSL)
        ↓
alembic upgrade head
        ↓
Schema created/updated
        ↓
Application / scripts connect
```

Do **not** use `Base.metadata.create_all()` for production initialization.

## PostgreSQL-specific features in use

The schema relies on features that are **not** portable to other databases:

- Native **ENUM** types (controlled vocabularies)
- **JSONB** (`audit_records`, evidence `metadata`)
- **UUID** primary keys
- **CHECK** constraints (LEI format, ISO country, date logic)
- Composite **FOREIGN KEY** constraints for `financial_entity_id` tenant alignment
- Partial / multi-column **UNIQUE** constraints

## Tenant isolation

**Current:** application-level filtering + relational constraints (`financial_entity_id`, composite FKs).

**Future:** PostgreSQL **Row-Level Security** on `financial_entity_id` (not enabled in Phase 0/1).

## Preflight

```bash
cd backend
export DATABASE_URL=...
python3 scripts/check_database.py
```
