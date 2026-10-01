# Pilot operator runbook

Concise steps for Azelos or customer IT running the **first real pilot**. Assumes [customer/DEPLOYMENT.md](./customer/DEPLOYMENT.md) for variable reference.

## 1. Deployment

**Option A — Docker (recommended for pilot)**

```bash
cd Azelos_DORA_BP
export JWT_SECRET_KEY="$(openssl rand -hex 32)"
docker compose --profile full up --build -d
```

**Option B — Single host**

```bash
cd Azelos_DORA_BP
./scripts/start-web-one-port.sh
# or backend venv + SERVE_FRONTEND=1 after npm run build
```

Record the customer-facing URL and whether UI is on `:8000` or nginx `:5173`.

## 2. Environment configuration

Set at minimum: `DATABASE_URL`, `JWT_SECRET_KEY` (≥32 chars if `APP_ENV=production`), `CORS_ORIGINS` (include exact browser origin), `STORAGE_PROVIDER=local`, `STORAGE_LOCAL_PATH` (Docker: `/app/storage` with volume).

## 3. Database setup

- PostgreSQL **16+**, database created, credentials in `DATABASE_URL`.
- Compose: Postgres on host port **5433** by default.

## 4. Migrations

Docker entrypoint runs `alembic upgrade head`. Manual:

```bash
cd backend && source .venv/bin/activate && export DATABASE_URL=... && python -m alembic upgrade head
```

Verify: `GET /ready` → `schema.ok` true.

## 5. Bootstrap platform operator

Once per environment:

```bash
cd backend
python scripts/bootstrap_platform_operator.py \
  --email operator@your-company.example \
  --password 'SecureOperatorPassword12!'
```

Login as that user for provisioning.

## 6. Tenant provisioning

1. Login → **Admin → Provision customer organization** (`/admin/provision`).
2. Enter legal name, country, ORG_ADMIN email, temporary password (≥12 chars).
3. Securely send credentials to customer OR use invitation flow after ORG_ADMIN exists.

API alternative: `POST /api/v1/tenant/provision` with SUPER_ADMIN bearer token.

**Do not** run `seed_pilot_demo.py` on a database shared with live customer data unless intentional.

## 7. ORG_ADMIN creation / invite

- **At provision:** admin user created with given password.
- **Later users:** ORG_ADMIN uses **Team members** → invitation link `/accept-invite?token=…`.

## 8. Storage verification

1. Login as ORG_ADMIN (or operator test tenant).
2. **Evidence** → upload small file → download.
3. Restart app container/process → download again.
4. If download fails after restart, fix volume mount (`dora_evidence_data`) or blob config.

## 9. Authentication verification

- Login succeeds for ORG_ADMIN.
- `curl -s -o /dev/null -w "%{http_code}" http://HOST/api/v1/ict-providers` → **401** without token.

## 10. Health / readiness

```bash
curl -s http://HOST/health
curl -s http://HOST/ready
```

Use `/ready` for load balancer probes.

## 11. Backup expectations

| Asset | Action |
|-------|--------|
| PostgreSQL | Scheduled backup (customer/operator); test restore once in pilot |
| Evidence files | Backup volume or bucket with DB |
| Secrets | Vault / secret manager, not in git |

## 12. Restart procedure

1. Stop app (keep Postgres running).
2. Start app; wait for `/ready` 200.
3. Spot-check login + one evidence download.

## 13. Tenant isolation verification

After two tenants exist (pilot + test):

- Login as tenant A; `GET /api/v1/ict-providers/{id-from-B}` → **404** (not 200).

Optional: run backend tests `test_customer_validation.py` in CI/staging.

## 14. Troubleshooting

| Symptom | Check |
|---------|--------|
| `/ready` schema false | Run migrations |
| 401 after login | Clock skew, expired token, wrong org |
| CORS errors | `CORS_ORIGINS` matches browser URL |
| Evidence 404 on download | Missing file on disk; `STORAGE_LOCAL_PATH` |
| SPA refresh 404 JSON | `SERVE_FRONTEND=1` and built `frontend/dist`; nginx `try_files` |
| Production won't start | `APP_ENV=production` requires strong `JWT_SECRET_KEY` |

## 15. Demo environment (optional)

Separate DB or instance:

```bash
python scripts/seed_pilot_demo.py
python ../scripts/verify_nordhaven_demo.py
```

Follow [DEMO-SCENARIO.md](./DEMO-SCENARIO.md).
