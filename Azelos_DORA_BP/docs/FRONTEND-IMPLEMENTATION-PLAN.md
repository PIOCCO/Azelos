# Frontend implementation plan

## Inspection

| Item | Finding |
|------|---------|
| Existing frontend | **None** — only `frontend/README.md` ("not yet implemented") |
| Reusable UI | N/A — greenfield in `Azelos_DORA_BP/frontend/` |
| Monorepo `maisonmaroc/` | Unrelated APIO app — **not** reused |
| Backend contract | 54 OpenAPI paths; source: `app.main:app` `/openapi.json` |
| Auth | `POST /api/v1/auth/login` → JWT Bearer + `organization_id` + `role` in body |

## Architecture (new)

- **Vite + React 18 + TypeScript**
- **React Router** — public `/login`, authenticated layout
- **TanStack Query** — server state, invalidation on profile/config change
- **`src/api/client.ts`** — single fetch wrapper (401/403/422 handling)
- **`AuthContext`** — token in `sessionStorage` (not localStorage for slightly better tab isolation)
- **`OrgContext`** — org id/role from login; loads profile, applicability, modules from API
- **`can()`** — RBAC helper from backend `role` string only (UI hints)
- **Tailwind CSS** — minimal styling, no full redesign

## Screens

| Route | API |
|-------|-----|
| `/login` | auth login |
| `/onboarding/profile` | GET/PATCH profile |
| `/onboarding/applicability` | GET applicability (read-only display) |
| `/` dashboard | list totals (providers, risks, functions, assets) |
| `/requirements` | baseline + org requirements |
| `/business-functions` | CRUD partial |
| `/ict-providers`, `/contracts`, `/ict-services`, `/sub-outsourcing` | list + create where API allows |
| `/information-assets`, `/ict-assets` | list + create, asset maps |
| `/risks`, `/controls`, `/evidence` | list |
| `/configuration/modules`, `/configuration/custom-fields` | ORG_ADMIN |
| Stub routes | incidents, BCP, DR, resilience-tests → API 501 message |

## Tests

- Vitest: API client error mapping, `can()`, applicability hook (mock fetch)
- Playwright: login → profile → applicability (optional if time)

## Docker

- `frontend/Dockerfile` dev/build; compose service `frontend` on :5173, `VITE_API_BASE_URL`
