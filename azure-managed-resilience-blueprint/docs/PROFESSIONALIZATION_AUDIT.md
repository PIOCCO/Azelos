# Professionalization audit — Atlas Azure Resilience

**Date:** 2026-09-18  
**Scope:** `azure-managed-resilience-blueprint/` (pre-polish baseline)

## Current architecture

```text
React (Vite) → nginx proxy → FastAPI (/api/v1)
                                  │
                    sync_pipeline → azure/collectors/sync.py
                                  │ (demo JSON or _fetch_live stub)
                                  ▼
                              PostgreSQL
```

- **IaC:** Terraform modules → Container Apps (API + UI), PostgreSQL Burstable, ACR, Key Vault, Storage, App Insights/LAW, subscription budget.
- **Auth:** Dev JWT (HS256) + role enum; Entra documented but not wired.
- **Multi-tenancy:** `tenant_id` on rows; `resolve_tenant_id()` on API routes.
- **Workflow:** Sync → alerts + recommendations → approve → execute (recorded) → audit.

## Already production-quality (foundation)

| Area | Notes |
|------|--------|
| API surface | Coherent REST groups: resources, backups, DR, security, costs, alerts, recommendations, reports |
| Tenant isolation | Backend checks on recommendations approve/execute; tests for cross-tenant 403 |
| Non-destructive model | Execute path records runbook only; no auto-delete |
| IaC modularity | Reusable Terraform modules; budget alerts; scale-to-zero Container Apps |
| Docker / Compose | Repeatable local stack |
| CI | Tests, Terraform validate, frontend build, API Docker build |

## Demo-only / MVP behavior

| Item | Location |
|------|----------|
| Product naming | “Azure Resilience”, “Demo Company”, `tenant-demo` in UI |
| Inventory | `demo_inventory.json`; `azure_mock` / hardcoded VM names in recommendations |
| Live Azure | `_fetch_live` raises `NotImplementedError` |
| Auth | Default JWT secret, seeded passwords, login pre-filled password |
| CORS | `allow_origins=["*"]` |
| Health | Single endpoint; exposes `azure_mock` |
| Alerts | Boolean `active` only; no ACK/RESOLVED lifecycle |
| Sync | No sync run entity, concurrency control, or history |
| Reports | Basic PDF text dump; internal wording |
| Resilience score | Not implemented |
| Scheduled jobs | Documented only (`workers/sync_scheduler.md`) |

## Security gaps

- Default `jwt_secret` and dev passwords usable if `ENVIRONMENT=production` not enforced.
- No request ID / structured logging / rate limits.
- Health may leak environment flags.
- No Entra abstraction boundary (JWT mixed in routes).
- Frontend tenant selection without confirmation for provider users.
- Audit log lacks resource/state/request_id fields.

## Reliability gaps

- No `/ready` (DB connectivity).
- Concurrent syncs per tenant possible.
- No partial sync status or error aggregation.
- Live Azure failures not modeled (partial/failed sync).

## UX gaps

- Minimal styling; raw JSON on dashboard security section.
- No loading/error/empty states; full page reload on sync.
- No breadcrumbs, filters, pagination, toasts, confirm dialogs.
- No demo indicator when using simulated data.
- Provider vs customer navigation not differentiated.

## Deployment gaps

- `deploy.sh` lacks strict validation steps and destroy script.
- Terraform: limited standard tags; no Container Apps Job for schedule.
- No production CORS / trusted host configuration.

## Missing Azure integrations

| Integration | Status |
|-------------|--------|
| Resource Graph | Stub |
| Resource Manager | Not separated |
| Cost Management | Demo JSON only |
| Azure Monitor | Demo health fields only |
| Backup / RSV | Demo flags only |
| Site Recovery | Demo DR snapshot |
| Defender for Cloud | Aggregated counts in demo |
| Advisor | Not implemented |
| Resource Health | Not implemented |

## Recommended changes (this pass)

1. Product identity **Atlas Azure Resilience** in UI/reports; rename seed tenant display names (keep internal IDs).
2. `DEMO_MODE` + production startup validation; auth abstraction (`AUTH_MODE=jwt|entra`).
3. Middleware: request ID, logging, exception handler, security headers, CORS by environment.
4. Sync engine: `sync_runs` table, mutex per tenant, status lifecycle.
5. Extend alerts, recommendations, audit schema + API (ACK/resolve, categories).
6. Resilience score service + documented formula.
7. Azure layer: normalized models + clients (Resource Graph, Cost, Monitor metrics) with graceful degradation.
8. Frontend: layout, components, navigation, executive dashboard, role-based nav, tenant picker for providers.
9. Reports: branded PDF sections.
10. Tests: IDOR, sync idempotency, resilience score, auth modes.
11. `deploy.sh` / `destroy.sh`, CA Job template, CI lint/fmt.
12. Documentation set per requirements.

## Intentionally NOT changed (avoid overengineering)

- No Kubernetes, microservices, Redis, Kafka, service mesh.
- No custom domain requirement.
- No automatic remediation against Azure resources.
- No full Entra OIDC implementation (stub + docs only).
- No separate customer SPA deployment (role-based UI in one app).
- No premium HA database or multi-region in dev Terraform.

---

## Post-polish update (same release)

Implemented: Atlas branding, resilience score, sync runs, alert lifecycle, auth abstraction, Azure client layer (Resource Graph + Cost live), production config validation, middleware (request ID, rate limit), expanded tests/docs, professionalized UI shell, deploy/destroy scripts.
Still partial: Entra OIDC, Backup/ASR/Defender live collectors, Container Apps scheduled job in Terraform, full PDF report sections.
