# DORA BP — Hosted SaaS Product Report

## Architecture

```text
Customer (browser)
   ↓ HTTPS
Secure Web App (React SPA on Azure Container Apps)
   ↓
DORA BP SaaS (FastAPI, single deployment)
   ├── Tenant A/B… data (PostgreSQL platform DB, financial_entity_id isolation)
   ├── Evidence (Azure Blob or configured storage)
   └── Integration layer (server-side only)
           ↓ secure outbound
Customer systems (optional)
   ├── Customer PostgreSQL (extensions / read models — connection test)
   ├── Customer HTTP APIs
   └── Azure subscriptions (cloud discovery — existing module)
```

**Important:** Core DORA registers (providers, contracts, risks, evidence metadata, etc.) remain in the **platform PostgreSQL** for the hosted multi-tenant deployment. Per-tenant **integration** configuration connects optional external systems; it does not replace the platform database without a dedicated single-tenant deployment and private networking project.

## Implemented

| Area | Detail |
|------|--------|
| Configuration UI | `/configuration/integrations` (ORG_ADMIN) |
| PostgreSQL integration | Host/port/database/user/password/ssl; save + test |
| HTTP API integration | Named external systems with optional API key |
| Azure cloud | Link to existing Cloud Environment module |
| Connection testing | `POST /api/v1/integrations/{id}/test` from backend |
| Secret handling | Fernet encryption at rest (`INTEGRATION_SECRETS_KEY` or JWT-derived); never returned in API |
| Tenant isolation | Integrations scoped by `financial_entity_id`; cross-tenant ID → 404 |
| RBAC | List/configure/test/disable: `ORG_ADMIN` only |
| Audit | `ConfigurationAuditLog` + platform audit on create/update/test |
| Onboarding | Link to integrations from Get started wizard |
| Azure IaC | Existing Terraform (ACA, PG, KV, Storage) — operator-deployed |

## Not implemented (infrastructure / product scope)

| Item | Reason |
|------|--------|
| Per-tenant routing of **all** DORA data to customer PostgreSQL | Would require replacing single-DB multitenant architecture |
| VPN / private endpoint / customer connector agent | Infrastructure project; documented in UI copy |
| Azure Key Vault **per-tenant** secret refs from app UI | Platform KV used at deploy time; app uses encrypted DB column |
| OIDC / SSO self-service in Integrations UI | OIDC remains deployment-level env today |
| Generic integration marketplace | Out of scope |

## Tests

| Test | Result (automated) |
|------|---------------------|
| Customer A/B isolation | `test_tenant_integrations.py` cross-tenant 404 |
| RBAC | USER → 403 on integrations |
| Secret leakage | Password not in JSON response |
| Connection test | Mocked PostgreSQL success |
| Customer A/B manual UI | Not run in agent VM |
| Azure deployment | Not run in agent VM |

Run: `cd backend && pytest tests/test_tenant_integrations.py`

## Final status

**NOT READY FOR CUSTOMER SaaS PILOT**

### Concrete blockers

1. **Azure staging/production** not deployed and smoke-tested with real HTTPS URL.
2. **Private connectivity** to customer PostgreSQL not established (network/VPN/connector).
3. **Operational runbooks** (provision tenant, backups, no demo seed on prod) must be executed by operator.
4. **Manual E2E** for two tenants on hosted URL (integrations UI + full DORA workflow).

After Azure deployment + staging validation (see `docs/azure/AZURE-PRODUCTION-VALIDATION-REPORT.md`), reassess gate to **READY FOR CUSTOMER SaaS PILOT**.
