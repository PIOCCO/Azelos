# APIO authentication & authorization

## Roles

| Role | Portal | How accounts are created |
|------|--------|---------------------------|
| `SUPER_ADMIN` | `/admin` | Bootstrap via `SUPER_ADMIN_*` env on first migration |
| `REAL_ESTATE_OWNER` | `/owner` | **Only** super-admin via `/api/admin/owners` |
| `CLIENT` | `/client/*` | Self-registration, email/password login, or Google OAuth |
| (none) | Public site | Browse listings without login |

Public **owner registration is disabled**. Owner login uses credentials issued by a super-admin.

## Session

- JWT stored in an **HttpOnly** cookie (`apio_token`).
- Production: set `COOKIE_SECURE=true`, strong `JWT_SECRET`, and `CLIENT_ORIGIN` to your HTTPS frontend origin(s).

## Google OAuth (clients only)

Backend routes:

- `GET /api/auth/google` — starts OAuth (redirect flow)
- `GET /api/auth/google/callback` — verifies code, sets cookie, redirects to `FRONTEND_URL/client/account`
- `POST /api/auth/google` — optional body `{ "idToken": "..." }` for ID-token verification

New or linked Google users always remain **`CLIENT`**. Existing `SUPER_ADMIN` / `REAL_ESTATE_OWNER` emails are **not** linked via Google.

### Google Cloud Console

Use an **OAuth 2.0 Web client** for the APIO production site.

**Application branding / consent:** configure for production domain **`apio.ma`** (contact emails in the app use `@apio.ma`).

**Authorized JavaScript origins** (examples):

- `https://apio.ma` (production frontend)
- `http://localhost:5173` (local Vite dev)

**Authorized redirect URIs** (backend callback — adjust port/host per environment):

- Production: `https://api.apio.ma/api/auth/google/callback` **or** your actual API host + `/api/auth/google/callback`
- Local: `http://localhost:3001/api/auth/google/callback` (must match `GOOGLE_REDIRECT_URI` in `.env`)

Set in `server/.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
FRONTEND_URL=
CLIENT_ORIGIN=
```

Never commit secrets or expose `GOOGLE_CLIENT_SECRET` in frontend code.

## Authorization highlights

- `/api/admin/*` — `SUPER_ADMIN` only; owner creation forces `REAL_ESTATE_OWNER` server-side.
- `/api/owner/properties` — derives owner from JWT (`owner_profile_id`), ignores client-supplied owner IDs.
- `/api/properties` — public catalog index (marketplace stays public).
- `POST /api/auth/owner/register` — **403**.

## Commands

```bash
cd maisonmaroc/server
cp .env.example .env   # edit secrets
npm install
npm run migrate
npm run dev            # :3001

cd maisonmaroc
npm install
npm run dev            # :5173, proxies /api → :3001
npm run test:auth      # from server/, with API running
```
