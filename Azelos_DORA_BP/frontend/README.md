# Azelos DORA Blueprint — Web UI

React + Vite frontend for the DORA Business Resilience Blueprint API.

## Development

1. Start PostgreSQL and the API (see `../backend/README.md`).
2. Copy `.env.example` to `.env` if needed (empty `VITE_API_BASE_URL` uses the Vite dev proxy).
3. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:5173 — API requests are proxied to http://127.0.0.1:8000.

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
