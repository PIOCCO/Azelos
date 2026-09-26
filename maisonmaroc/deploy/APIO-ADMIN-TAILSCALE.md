# APIO Admin Dashboard (Tailscale-only)

## Dribex reference (inspected in this repository)

The **Dribex** application stack (native `/admin`, Tailscale nginx, firewall) is **not** source-controlled in this monorepo. Deploy docs only require that existing Dribex routes (`/`, `/api`, `/admin`, …) stay unchanged when APIO is mounted at `/APIO/`.

On the production host, discover the **Dribex admin port** with:

```bash
ss -lntp | grep -E 'LISTEN.*:(721[0-9]|808[0-9])'
docker compose ps
grep -R admin /etc/nginx/sites-enabled/
```

Use that port as the reference; **do not** assign the same port to APIO Admin.

## APIO Admin port selected

| Service | Default port | Env |
|---------|--------------|-----|
| APIO public API | 3001 | `PORT` |
| **APIO Admin** (API + SPA) | **7217** | `APIO_ADMIN_PORT` |

7217 was chosen as an unused dedicated port in this environment (`ss -lntp`). Override via `APIO_ADMIN_PORT` if it conflicts on your host.

## Architecture

```text
Internet → dribex.ma/APIO/     → public SPA + /APIO/api/ → apio-server:3001 (no /api/admin/*)

Tailscale → TS_IP:7217 (nginx) → 127.0.0.1:7217 → apio-admin (adminIndex.js)
                                              ├── /api/admin/*
                                              ├── /api/auth/admin/login
                                              └── static admin/dist
```

## Network restriction (defense in depth)

1. **Application:** `requireAdminNetwork` on every admin listener request (`APIO_ADMIN_ALLOWED_NETWORKS` CIDR list).
2. **Bind:** `APIO_ADMIN_BIND=127.0.0.1` (default); Docker publishes `127.0.0.1:7217:7217` only.
3. **Nginx:** Tailscale listener + `allow 100.64.0.0/10; deny all;` — see `nginx-apio-admin-tailscale.example.conf`.
4. **Firewall:** Block WAN access to the admin port; allow `tailscale0` (example in nginx comment).
5. **Public API:** `blockPublicAdminAccess()` returns **404** for `/api/admin/*` and `/api/auth/admin/*`.

## Authentication

- Separate cookie: `apio_admin_token` (HttpOnly, Secure in production, SameSite strict).
- Separate JWT: `APIO_ADMIN_JWT_SECRET` (required in production on admin server).
- Same APIO SQLite database as public API; **no** Dribex PostgreSQL credentials.

## Environment

See `server/.env.example` keys:

- `APIO_ADMIN_PORT`, `APIO_ADMIN_BIND`, `APIO_ADMIN_ALLOWED_NETWORKS`
- `APIO_ADMIN_JWT_SECRET`, `APIO_ADMIN_STATIC_DIR`
- `APIO_ADMIN_NETWORK_GUARD=false` — **tests only**

## Build & run

```bash
cd maisonmaroc
npm run build:admin
cd server
APIO_ADMIN_ALLOWED_NETWORKS=100.64.0.0/10,127.0.0.0/8 npm run start:admin
```

Public API (unchanged):

```bash
npm run start
```

## Tests

With both listeners running and test guard disabled:

```bash
cd server
APIO_ADMIN_NETWORK_GUARD=false \
APIO_ADMIN_ALLOWED_NETWORKS=127.0.0.0/8 \
npm run test:admin-network
npm test
```

## Public SPA

Admin routes were removed from the public React app (`/admin/*` → `/403`). Use the standalone admin UI only over Tailscale.
