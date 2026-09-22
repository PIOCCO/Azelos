# Configuration

Primary file: `config/clients/<client>.yaml` (see `config/client.example.yaml`).

Validation:

```bash
WHBP_CLIENT_CONFIG=config/clients/demo-static.yaml ./deployment/validate-config.sh
```

Environment guardrails merge from `config/environments/<type>.yaml`:

- Development forbids production-like domains (use `*.local`)
- Production requires `WHBP_PRODUCTION_APPROVED=true` for deploy script

Framework matrix:

| frontend.framework | Runtime |
|--------------------|---------|
| static, react, vue | Build → Nginx |
| nextjs | Node SSR (`Dockerfile.ssr`) |

| backend.framework | Template |
|-------------------|----------|
| node, python, go, php | `backend/examples/<framework>/Dockerfile` |

Redis deploys **only** when `redis.enabled: true`.

## Proxy mode (`hosting.shared_proxy`)

| Value | Behavior |
|-------|----------|
| `false` (default) | Client renders its own nginx proxy bound to host `:80/:443`. One client per host / dedicated VM. |
| `true` | Client renders no proxy and no host ports; app containers join the external `whbp_edge` network with Traefik labels. Many clients share one host behind a single Traefik proxy (`deployment/edge-up.sh`). |

When `shared_proxy: true`, a `domains.frontend` (and `domains.backend` if the
backend is enabled) is required, since Traefik routes by Host header. Give each
client distinct domains. See `docs/traefik.md`.
