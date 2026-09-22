# Shared Traefik edge proxy (multi-client single host)

Host many clients on one VM behind a single Traefik reverse proxy that owns
`:80`/`:443` and routes to each client by Host header. This avoids the port
collision that would occur if every client rendered its own nginx proxy on the
same host.

## When to use it

- **`hosting.shared_proxy: true`** — several clients share one VM (cost-efficient).
- **`hosting.shared_proxy: false`** (default) — one client per host / dedicated VM
  for stronger isolation (regulated clients).

## How it works

- A single Traefik instance runs per host (`deployment/edge-up.sh`) and owns the
  external Docker network `whbp_edge`.
- Each shared client stack (`automation/whbp/render.py`) renders **no** proxy and
  **no** published host ports. Its `frontend`/`backend` containers join both the
  per-client network and `whbp_edge`, and carry Traefik labels:
  - `traefik.enable=true`
  - `traefik.http.routers.<project>-fe.rule=Host(` + "`" + `<frontend-domain>` + "`" + `)`
  - `traefik.http.services.<project>-fe.loadbalancer.server.port=<port>`
- `postgres`/`redis`, named volumes, and CPU/memory limits stay strictly
  per-client, so isolation is preserved except for the shared ingress.

## Operating the edge proxy

```bash
# Start once per host (HTTP only)
./deployment/edge-up.sh

# Start with Let's Encrypt (public DNS must point at the host)
export WHBP_TRAEFIK_ACME=true WHBP_ACME_EMAIL=ops@example.com
# export WHBP_ACME_STAGING=true   # use LE staging CA while testing
./deployment/edge-up.sh

# Expose the Traefik dashboard on 127.0.0.1:8080 (never public)
export WHBP_TRAEFIK_DASHBOARD=true
./deployment/edge-up.sh

# Stop it (running clients keep their networks)
./deployment/edge-down.sh
```

Environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `WHBP_TRAEFIK_ACME` | `false` | Enable Let's Encrypt certificate resolver |
| `WHBP_ACME_EMAIL` | — | Contact email (required when ACME enabled) |
| `WHBP_ACME_STAGING` | `false` | Use the Let's Encrypt staging CA |
| `WHBP_TRAEFIK_DASHBOARD` | `false` | Expose the insecure dashboard on loopback `:8080` |
| `WHBP_EDGE_NETWORK` | `whbp_edge` | Shared edge network name |

## Deploying clients behind it

```bash
./deployment/edge-up.sh
WHBP_CLIENT_CONFIG=config/clients/demo-shared-a.yaml ./deployment/deploy.sh
WHBP_CLIENT_CONFIG=config/clients/demo-shared-b.yaml ./deployment/deploy.sh
```

`deploy.sh` creates the `whbp_edge` network if missing and warns if the Traefik
edge proxy is not running. `health-check.sh` verifies each client through Traefik
using its Host header.

## Notes and limits

- Give every client **distinct** `domains.*`.
- Blast radius is the host: one VM outage affects all its clients.
- This is container-level isolation, not VM-level — keep high-isolation clients on
  their own VM with `shared_proxy: false`.
