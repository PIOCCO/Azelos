# DORA Business Resilience Blueprint — architecture

```text
                        FRONTEND (future)
                           │
                           ▼
                        FASTAPI
                           │
              ┌────────────┼────────────┐
              │            │            │
           AUTH/RBAC   DOMAIN LOGIC   RULE ENGINE
              │       (services)   (ApplicabilityService)
              └────────────┬───────────────┘
                           │
                      SQLAlchemy
                           │
                           ▼
                    PostgreSQL (single DB)
                           │
             ┌─────────────┼─────────────┐
             │             │             │
         dora_core    dora_config  client_extensions
      (stable domain) (rules/config) (customer metadata)
```

## Design principle

One normalized **DORA core** for all financial entity types. Differences come from:

- **Organization profile** (`organization_profiles`) — type, size, Art. 16, TLPT, critical functions flags
- **Profile rules** (`dora_config.profile_rules`) — declarative applicability
- **Modules & settings** — `platform_modules`, `organization_modules`, `organization_settings`
- **Custom fields** — definitions + JSONB values (no `ALTER TABLE` per customer)
- **Client extensions** — optional customer DDL outside app migrations

There are **no** sector-specific databases or schemas (`bank_schema`, etc.).

## Logical mapping (current tables)

| Concept | Table(s) |
|---------|----------|
| Organization | `financial_entities` |
| Profile | `organization_profiles` |
| Business function | `business_functions` |
| ICT asset | `ict_assets`, `information_assets`, `asset_function_maps` |
| Supplier | `ict_providers` |
| Contract | `contracts` |
| ICT service | `ict_services` |
| Risk | `risk_assessments` |
| Regulatory baseline | `dora_domains`, `dora_requirements` |
| Org implementation | `organization_requirements` |
| Evidence | `evidence` |

Criticality: `ict_assets.inherent_criticality` is independent of `business_functions.critical_or_important`. Links set `asset_function_maps.supports_critical_function` without overwriting inherent classification.

## API layers

- `/api/v1/*` — JWT + RBAC, tenant from token
- `/api/config/*` — legacy header auth (backward compatible)

Key endpoints: organization profile, applicability, requirements, config modules/custom-fields/settings, ICT assets.

## Migrations

Alembic only (`python -m alembic upgrade head`). Revision `007_profiles_ict` adds profiles, ICT assets, and seeded profile rules.

See also: [DEPLOYMENT.md](./DEPLOYMENT.md), [FASTAPI-IMPLEMENTATION-PLAN.md](./FASTAPI-IMPLEMENTATION-PLAN.md).
