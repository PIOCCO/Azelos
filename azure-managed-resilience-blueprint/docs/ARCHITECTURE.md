# Architecture

## Flow

```text
Azure Management APIs / Resource Graph
        │
        ▼
Collectors (azure/collectors) — mock or live
        │
        ▼
Management API (FastAPI) — discovery, checks, recommendations
        │
        ▼
PostgreSQL — tenants, inventory, findings, costs, alerts, audit
        │
        ▼
React dashboard (Container App or nginx)
        │
        ▼
Reports & alerts (Azure Monitor budget + in-app alerts)
```

## Multi-tenancy

Every business row includes `tenant_id`. API resolves tenant from JWT role:

- **Provider Admin / Operator** — must pass `tenant_id` query param.
- **Customer roles** — forced to JWT `tenant_id`; cross-tenant requests return 403.

## Approval workflow

Detect → explain → recommend → **approve** → execute (recorded runbook stub; no auto-destructive changes).

## Azure-native MVP

- **Deploy**: Container Apps (scale-to-zero), PostgreSQL Flexible Burstable, ACR Basic, Log Analytics + Application Insights, subscription budget.
- **Identity**: System-assigned managed identity on API container (live mode).
- **Auth**: Entra ID in production; dev JWT login for local/MVP.

See `LIGHTHOUSE.md` for customer onboarding model.
