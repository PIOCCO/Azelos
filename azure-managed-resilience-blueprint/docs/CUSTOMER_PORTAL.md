# Customer portal

## Architecture

Same FastAPI backend and PostgreSQL as the provider portal. Customer routes live under `/api/v1/customer/*` and **never accept a tenant ID from the client** for authorization — the tenant is derived from the authenticated user's JWT (`CUSTOMER_ADMIN` / `CUSTOMER_VIEWER`).

```text
User (Entra or dev JWT)
    → role + tenant_id
    → /api/v1/customer/*
    → tenant-scoped PostgreSQL data
    → React customer UI (/customer/*)
```

## Roles

| Role | Portal | Capabilities |
|------|--------|--------------|
| PROVIDER_ADMIN / OPERATOR | `/` | All tenants (existing API) |
| CUSTOMER_ADMIN | `/customer` | View + approve recommendations, alerts |
| CUSTOMER_VIEWER | `/customer` | Read-only |

## Financial data flow

```text
Azure Cost Management / demo JSON
    → sync (scheduled job + manual)
    → cost_snapshots, cost_daily_records, cost_service_records, cost_anomaly_records
    → customer_finops service
    → /api/v1/customer/financial/*
    → charts & tables
```

Dashboard requests do **not** call Azure directly.

## Demo mode

When `DEMO_MODE=true`, financial figures come from `demo_inventory.json`. UI shows **Demo environment**.

## Production authentication

Use `AUTH_MODE=entra` in production. Development JWT is documented in `docs/DEPLOYMENT.md` only.
