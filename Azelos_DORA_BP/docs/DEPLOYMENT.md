# Deployment (hosting-agnostic)

## Database

The **client provides PostgreSQL 16+**. The Blueprint only needs a connection string.

Examples (same application binaries; different `DATABASE_URL`):

| Environment | Example host |
|-------------|----------------|
| Azure Database for PostgreSQL | `your-server.postgres.database.azure.com` |
| On-premises | `10.20.30.40` or internal DNS |
| AWS RDS PostgreSQL | `mydb.xxxx.eu-west-1.rds.amazonaws.com` |
| Local Docker (dev only) | `localhost:5433` via `docker compose` |

```env
DATABASE_URL=postgresql+psycopg://dora:change-me@HOST:5432/dora_supplier_risk
DB_SSL_MODE=require
```

## Schema setup

On the target database (once per environment):

```bash
cd Azelos_DORA_BP/backend
export DATABASE_URL=...
alembic upgrade head
python3 scripts/seed_dev.py   # optional dev/demo only
python3 scripts/check_database.py
```

## Application modes

### Local development

```text
Docker PostgreSQL (optional) → DATABASE_URL → backend scripts/tests
```

### Client production

```text
Client PostgreSQL → DATABASE_URL → future FastAPI layer / workers
```

The code path is identical; only configuration changes.

## Object storage

Configure separately from the database:

```env
STORAGE_PROVIDER=local
```

Production will typically use `azure_blob`, `s3`, or `s3_compatible` once adapters are implemented with optional SDK dependencies.

## Out of scope here

- Terraform / Azure resource provisioning
- CI/CD pipelines
- Kubernetes manifests

Those layers supply **connection strings and secrets** to this Blueprint; they are not embedded in the codebase.
