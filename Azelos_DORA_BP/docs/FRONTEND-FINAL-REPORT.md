# Frontend implementation report

## IMPLEMENTED

- Greenfield Vite + React 18 + TypeScript SPA under `frontend/`
- Centralized `apiRequest` client with `ApiError` (401/403/422 messaging)
- Auth (JWT in `sessionStorage`) and org context (profile, applicability, modules via TanStack Query)
- Module-driven navigation from backend module applicability (no sector if/else rules)
- Onboarding: profile edit + applicability read-only display
- Dashboard using paginated API `total` fields only
- Regulatory baseline + org requirements screens
- Core list/create flows: business functions, ICT assets + asset–function maps, paginated entity lists
- Controls: definitions (read-only) + contract controls
- Configuration: modules toggle, custom field admin (ORG_ADMIN)
- Stub pages for 501 endpoints (incidents, BCP, DR, resilience tests)
- Vitest unit tests; Playwright E2E (opt-in via `E2E_WITH_API=1`)
- Frontend Dockerfile + optional `docker compose --profile full` stack

## FRONTEND ARCHITECTURE

- React Router, TanStack Query, Tailwind CSS
- `AuthContext` + `OrgContext` + `can()` permission helper (UI only)

## API CONTRACT

- Source of truth: FastAPI `/openapi.json` (54 paths)
- All calls use `/api/v1/...` except dev proxy to port 8000

## SCREENS / ROUTES

See `docs/FRONTEND-IMPLEMENTATION-PLAN.md` and `frontend/src/App.tsx`

## BACKEND API DEFECTS FOUND

- None requiring code changes during this pass

## MISSING API ENDPOINTS (for full DORA UX)

- Incidents, BCP, DR, resilience tests (501 stubs)
- Dedicated dashboard aggregation endpoint (UI uses list totals)
- Organization switching (single org from login today)
- Evidence upload (metadata list only; storage adapters not bundled)

## REMAINING ISSUES

- E2E requires running API + DB locally
- Backend full pytest needs PostgreSQL on port 5433
