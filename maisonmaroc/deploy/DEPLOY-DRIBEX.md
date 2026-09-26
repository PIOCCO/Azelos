# Deploy APIO on `https://dribex.ma/APIO`

This keeps **Dribex** at `/` and routes APIO under **`/APIO`** without sharing Dribex’s **`/api`** prefix.

## Architecture

```text
Browser → https://dribex.ma/APIO/*     → static SPA (dist/)
Browser → https://dribex.ma/APIO/api/* → Nginx → APIO Express :3001 (/api/*)
```

## Build

```bash
cd maisonmaroc
npm ci
npm run migrate --prefix server
npm run build:apio
```

Upload **`dist/`** contents to the web path mapped to `/APIO/` (see `deploy/nginx-dribex-apio.example.conf`).

## APIO server (`maisonmaroc/server/.env`)

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<openssl rand -hex 32>
SUPER_ADMIN_EMAIL=...
SUPER_ADMIN_PASSWORD=<strong>
ALLOWED_ORIGINS=https://dribex.ma
FRONTEND_URL=https://dribex.ma/APIO
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
DATABASE_PATH=/var/lib/apio/apio.sqlite
UPLOAD_DIR=/var/lib/apio/uploads
STRICT_CONFIG=true

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://dribex.ma/APIO/api/auth/google/callback
```

Google Cloud Console:

- **Authorized JavaScript origins:** `https://dribex.ma`
- **Authorized redirect URIs:** `https://dribex.ma/APIO/api/auth/google/callback`

## Frontend build-time (optional)

Usually **not** required when using `build:apio` — the app detects basename `/APIO` and calls `/APIO/api/...`.

Optional overrides:

```env
VITE_CANONICAL_ORIGIN=https://dribex.ma/APIO
VITE_GOOGLE_CLIENT_ID=<same as server GOOGLE_CLIENT_ID>
```

Do **not** set `VITE_API_URL` unless the API is on another host.

## Run API

```bash
cd maisonmaroc/server
npm run start
```

Use systemd/PM2 or `deploy/docker-compose.apio.yml` (bind API to localhost only).

## Verify

- `https://dribex.ma/APIO/` — homepage
- Refresh: `/APIO/membres`, `/APIO/documents`, `/APIO/owner/login`
- `https://dribex.ma/APIO/api/health` → `{"ok":true}`
- Documents: `/APIO/documents` → **Télécharger le PDF**
- Dribex: `/`, `/api`, `/admin`, `/metrics`, `/ready` unchanged

## Tests (before go-live)

```bash
cd maisonmaroc/server && npm test
```

Point `API_BASE=https://dribex.ma/APIO` for smoke tests against staging if needed.
