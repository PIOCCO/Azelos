# Architecture

## Portable application layer

Two proxy topologies are supported, selected per client with `hosting.shared_proxy`.

Dedicated proxy (`hosting.shared_proxy: false`, default) — one client per host:

```text
Internet → HTTPS → Nginx (per-client, :80/:443) → frontend (static/nginx or SSR)
                                                 → backend (internal network)
                                                 → PostgreSQL (internal, optional)
                                                 → Redis (internal, optional)
```

Shared proxy (`hosting.shared_proxy: true`) — many clients on one host:

```text
Internet → HTTPS → Traefik (one per host, :80/:443)
                     ├─ Host(a.example.com) → client A frontend/backend
                     ├─ Host(b.example.com) → client B frontend/backend
                     └─ ...
```

With the shared proxy, each client stack drops its own nginx (which would collide
on host ports) and instead attaches its app containers to the external
`whbp_edge` network with Traefik routing labels. A single Traefik instance
(`deployment/edge-up.sh`) routes by Host header and can terminate TLS via
Let's Encrypt. See `docs/traefik.md`.

Azure is **optional** (`infrastructure/terraform/environments/vps` for VM provisioning only).

## Deployment strategies

| Strategy | Behavior |
|----------|----------|
| `rolling` | Build → up → health check → record version |
| `blue-green` | Same Compose project; extend with dual service names for larger hosts |

No Kubernetes by default.

## Client isolation

Each client uses:

- Unique Compose project name (`client-id` + environment)
- Dedicated Docker network
- Separate `config/clients/<id>.yaml`
- Separate `.generated/<client-id>-<env>/` output
- Secret env vars scoped per deployment

Shared VPS is supported for low-risk clients; dedicated VM documented for regulated clients.

In shared-proxy mode this isolation is preserved: only the app containers
(`frontend`/`backend`) additionally join the shared `whbp_edge` network so
Traefik can reach them, while `postgres`/`redis`, volumes, and resource limits
stay per-client. The blast radius is the host — keep regulated clients on their
own VM (`shared_proxy: false`).

## Business Continuity integration (read-only export)

`automation/whbp/export_inventory.py` writes:

- `exports/inventory.json` — services, dependencies, health endpoint, deployment strategy

A separate Business Continuity blueprint can consume this without merging repositories.

## Future control plane interfaces

| Future API | Current CLI |
|------------|-------------|
| `POST /deploy` | `deployment/deploy.sh` |
| `POST /rollback` | `deployment/rollback.sh` |
| `POST /restart` | `deployment/restart.sh` |
| `GET /health` | `deployment/health-check.sh` |
| `GET /status` | `docker compose ps` + inventory export |
| `POST /backup` | `backup/scripts/backup.sh` |
| `POST /restore` | `backup/scripts/restore.sh` |
| `GET /logs` | `docker compose logs` (by service label) |
