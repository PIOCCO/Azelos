# Integration & production-readiness report

Generated as part of frontend ↔ FastAPI integration validation.

## Test commands (executed in CI/agent environment)

```bash
# Backend (TEST_DATABASE_URL or DATABASE_URL → dora_supplier_risk_test)
cd backend && pytest -q

# Frontend
cd frontend && npm run lint && npm run test && npm run build
```

## IMPLEMENTED (integration)

- Central `apiRequest` with 401 → `AuthSessionSync` (logout + query cache clear + `/login`)
- Org context: organization entity, profile, applicability, modules from API
- Module-driven navigation from backend applicability (no sector if/else)
- Auto-serve `frontend/dist` when built; `DISABLE_FRONTEND_STATIC` for pytest
- Docker `Dockerfile.app` + compose `full` profile (API + UI on :8000)
- Tailscale / access docs (no SSH required)

## FRONTEND ↔ FASTAPI INTEGRATION

| Area | Status |
|------|--------|
| Auth login/logout | Real `/api/v1/auth/login` |
| Paginated lists | Real endpoints with JWT tenant context |
| Profile / applicability | Organization path + backend rules |
| Requirements | Baseline + org implementation |
| Stubs (incidents, BCP, DR, resilience) | 501 probe, no mock CRUD |
| Global search / notifications | Disabled (no API) |

## MISSING API ENDPOINTS (not faked)

Organization self-create (multi-org switch), full incident/BCP/DR/resilience CRUD, findings/corrective actions/audits/BIA/backups, evidence upload, dashboard aggregates, global search, activity feed, users/roles admin UI, full risk treatment workflow UI, org requirement PATCH from UI.

## DEFECTS FOUND AND FIXED

- StaticFiles mount caused **405** on unknown POST routes during pytest → `DISABLE_FRONTEND_STATIC` in test conftest
- Docker dist path: resolve both repo and `/app/frontend/dist` layouts

## DOCKER

```bash
docker compose up -d postgres
docker compose --profile full up --build backend
# http://localhost:8000
```

Run migrations manually on first boot if needed: `alembic upgrade head` in container.

## REMAINING ISSUES

- Playwright E2E against live stack optional (`E2E_WITH_API=1`); primary E2E is `tests/test_e2e_org_flow.py` + `test_integration_security.py`
- Full Azure deployment out of scope
- Extension registration RBAC: SECURITY_MANAGER gets 403 (test in test_api_v1)

See also: `docs/FRONTEND-FINAL-REPORT.md`, `docs/UI-DESIGN-IMPLEMENTATION.md`
