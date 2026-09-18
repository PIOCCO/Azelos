# Architecture

## Portable application layer

```text
Internet → HTTPS → Nginx (proxy) → frontend (static/nginx or SSR)
                                 → backend (internal network)
                                 → PostgreSQL (internal, optional)
                                 → Redis (internal, optional)
```

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
