# Deployment (customer & operator)

Summary for pilot deployments. See also [DEPLOYMENT.md](../../DEPLOYMENT.md) and [STORAGE-ARCHITECTURE.md](../../STORAGE-ARCHITECTURE.md).

## Environment variables (essential)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (`postgresql+psycopg://…`) |
| `JWT_SECRET_KEY` | Signing key; **≥32 characters** when `APP_ENV=production` |
| `APP_ENV` | `production` enables production safety checks |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API |
| `SERVE_FRONTEND` | `1` to serve built React UI from API container |
| `STORAGE_PROVIDER` | `local` (pilot) or cloud provider when configured |
| `STORAGE_LOCAL_PATH` | Directory for evidence files when `local` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Session lifetime (default 60) |
| `EXPOSE_ERROR_DETAILS` | Keep `false` in production |

Optional: `DB_SSL_MODE=require`, OIDC variables, GraphQL introspection flags.

## PostgreSQL

- Version **16+** recommended.
- Run migrations once per upgrade: `python -m alembic upgrade head` (Docker entrypoint does this automatically).
- Schemas: application uses configured core/config schemas (defaults documented in [DATABASE-CONTRACT.md](../../DATABASE-CONTRACT.md)).

## Storage

- Metadata in PostgreSQL; files in object storage.
- **Docker pilot:** compose file mounts `dora_evidence_data` at `/app/storage` — verify upload/download after deploy.

## Docker deployment

```bash
cd Azelos_DORA_BP
export JWT_SECRET_KEY="$(openssl rand -hex 32)"
docker compose --profile full up --build
```

- **Postgres:** port `5433` on host → `5432` in compose network.
- **Backend:** port `8000` (API + UI when `SERVE_FRONTEND=1`).
- **Frontend profile:** nginx on `5173` proxying `/api`, `/graphql`, `/health`, `/ready`.

After first boot:

```bash
docker compose exec backend python scripts/bootstrap_platform_operator.py \
  --email operator@example.com --password 'YourSecurePassword12!'
```

Provision customer tenant via UI or API.

**Do not** run `seed_pilot_demo.py` on a database shared with real customers unless intentional.

## Health and readiness

| Endpoint | Meaning |
|----------|---------|
| `GET /health` | Process alive |
| `GET /ready` | Database reachable and migration head aligned |

Use `/ready` for load balancer readiness probes.

## Backup expectations

| Component | Backup |
|-----------|--------|
| PostgreSQL | Customer/operator scheduled backups (point-in-time if required) |
| Evidence storage | Same schedule as files or bucket replication |
| Application config | Secrets in vault; no DB passwords in image |

Restore test at least once during pilot.

## Restart procedure

1. Stop application container(s) gracefully.
2. Ensure PostgreSQL remains running (data on `dora_pg_data` volume in compose).
3. Start application; confirm `/ready`.
4. Login and spot-check providers + evidence download.

Evidence on local storage requires the **evidence volume** to persist across container recreation.

## One-port dev / demo

```bash
./scripts/start-web-one-port.sh
# http://127.0.0.1:8000
```
