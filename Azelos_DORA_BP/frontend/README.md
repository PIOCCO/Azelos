# Azelos DORA Blueprint — Web UI

React + Vite frontend for the DORA Business Resilience Blueprint API.

## Development

**If the browser says “This site can’t be reached”**, the dev server is not running (or the API/DB is down). Start all three:

```bash
# From Azelos_DORA_BP/
docker compose up -d postgres          # OR use local Postgres on :5432
chmod +x scripts/dev-local.sh
./scripts/dev-local.sh                 # migrations + API :8000 + UI :5173
```

Manual steps:

1. `backend/.env` with `DATABASE_URL` (Docker Compose uses **5433**; many local installs use **5432**).
2. `cd backend && alembic upgrade head && python scripts/seed_api_user.py`
3. `uvicorn app.main:app --reload --port 8000`
4. `cd frontend && npm install && npm run dev`

Open **http://127.0.0.1:5173** (not https). The UI proxies `/api` to **http://127.0.0.1:8000**.

Copy `frontend/.env.example` to `.env` only if you need a non-proxy API URL (`VITE_API_BASE_URL`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run lint` | TypeScript check |
| `npm run test` | Vitest unit tests |
| `npm run build` | Production bundle |
| `npm run e2e` | Playwright (set `E2E_WITH_API=1` when API is up) |

## Architecture

- **Auth**: JWT in `sessionStorage`; org id from login response (backend enforces tenant access).
- **Org context**: Profile, applicability, and modules loaded from API; invalidated after profile/module changes.
- **Navigation**: Module visibility from backend module applicability — no client-side DORA rules.

## Docker

Build static assets and serve with nginx (proxy `/api` to backend service):

```bash
docker build -t dora-frontend .
```

Use with `docker-compose` `frontend` service when the stack includes `backend`.
