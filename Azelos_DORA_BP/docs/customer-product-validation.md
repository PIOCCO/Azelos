# Customer product validation

Validated against implementation on `cursor/v1-saas-p0-p1-f761` (API tests + production Docker build).

## Realistic scenario (supported steps)

**A company has this problem:** A German payment institution must maintain a DORA-aligned ICT third-party register, show how critical functions depend on ICT services and providers, track requirement implementation, and evidence key controls — without a spreadsheet and disconnected folders.

| Step | Application support |
|------|------------------------|
| Company setup | `FinancialEntity` + profile; operator runs seed or `POST /tenant/provision` (SUPER_ADMIN) |
| User setup | Login; org admin invites via Team → `/accept-invite` |
| BP configuration | Get started wizard, applicability, modules, requirements statuses |
| Data input | UI create: providers, risks, incidents, BCP/DR/tests, functions, assets, evidence upload |
| Main workflow | Third-party + risk + requirements + relationship map |
| Automation | Risk level calculation, applicability rules, graph from DB, dashboard/resilience aggregates |
| Findings | Resilience findings lists, DORA overview KPIs |
| Actions | Requirement status updates, remediation lists (read), incident register |
| Output | Dashboard, DORA overview, JSON reports (`/resilience/reports/*`), CSV export providers, tenant ZIP export |

## Deployment validation

- **Single-container delivery:** `Dockerfile.app` builds frontend + runs migrations via `docker-entrypoint.sh`, serves UI on `:8000` with `SERVE_FRONTEND=1`.
- **Compose:** `docker compose --profile full up` — Postgres healthcheck → backend → optional nginx frontend.
- **Health:** `/health`, `/ready` (schema-aware).
- **Persistence:** Postgres volume `dora_pg_data`; evidence files on configured storage path.

## Product boundary

See final user-facing summary in repository README section added by validation pass.
