# Cloud Business Resilience Platform — Implementation Report

## Architecture changes

- Introduced `CloudProviderAdapter` with `AzureProviderAdapter` (`backend/app/cloud/`).
- Resilience workflow services: discovery, assessment engine, dashboard aggregation, recovery test calculation.
- Extended audit actions for cloud/discovery/findings/remediation/reports.
- Frontend navigation reoriented to platform workflow while preserving DORA module routes.

## Database (migration `008_cloud_resilience`)

New tables: `cloud_accounts`, `cloud_resources`, `business_services`, `service_dependencies`, `resilience_assessments`, `resilience_assessment_controls`, `resilience_findings`, `remediation_actions`, `resilience_evidence_items`, `recovery_tests`, `business_service_dora_links`.

Existing DORA tables unchanged.

## API endpoints (prefix `/api/v1`)

| Area | Endpoints |
|------|-----------|
| Cloud | `GET/POST /cloud-accounts`, `POST /cloud-accounts/{id}/discover`, `GET/PATCH /cloud-resources` |
| Business services | `GET/POST/PATCH /business-services`, dependencies, `POST .../assessments` |
| Resilience | `/resilience/dashboard`, `/findings`, `/remediation`, `/evidence`, `/recovery-tests`, `/dora-links`, `/reports/{type}` |

## Azure integration status

- Server-side credential lookup via `auth_config_ref` + env vars (`*_TENANT_ID`, `*_CLIENT_ID`, `*_CLIENT_SECRET`).
- Discovery uses Azure Resource Management API when optional `[azure]` deps installed.
- Without credentials or SDK: **zero resources**, explicit status message — no fake data.

## DORA

- Unchanged baseline and organization requirements.
- New `business_service_dora_links` for per-service factual statuses (`implemented`, `partially_implemented`, etc.).
- DORA hub UI shows counts — not “compliant”.

## Security

- RBAC on mutating cloud/resilience operations (`SECURITY_MANAGER`, `BUSINESS_CONTINUITY_MANAGER`, `ORG_ADMIN` as appropriate).
- Tenant isolation tests in `tests/test_cloud_resilience.py`.

## Tests executed (this run)

- Backend: **61 passed** (`pytest -q`, PostgreSQL via `DATABASE_URL`)
- Frontend: **10 passed** (`npm test`), **build OK** (`npm run build`)

## Limitations / next steps

- AWS/GCP adapters not implemented (factory raises for non-Azure).
- Deep Azure service-specific configuration (backup/DR flags) requires additional API calls per resource type.
- UI create flows for accounts/services/findings are API-first (forms can be added).
- PDF report export not implemented (JSON reports only).
- Login/logout audit hooks can be wired in auth router.

## What the platform does NOT claim

See `docs/CLOUD-RESILIENCE-PLATFORM.md`.
