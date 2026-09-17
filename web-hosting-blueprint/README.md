# Web Hosting Blueprint

Reusable, **configuration-first** hosting platform for freelance client deployments on Linux (VPS, Azure VM, similar).

```text
ONE BLUEPRINT + CLIENT CONFIGURATION → CLIENT DEPLOYMENT
```

Independent from the Business Continuity Blueprint — integration via `exports/inventory.json`.

## Quick start

```bash
cd web-hosting-blueprint
pip install -r requirements.txt
cp .env.example .env
export WHBP_CLIENT_CONFIG=config/clients/demo-static.yaml
export WHBP_POSTGRES_PASSWORD=devpass

./deployment/validate-config.sh
./deployment/deploy.sh
./deployment/health-check.sh
```

## Reference deployments (same blueprint, different config)

| Config | Stack |
|--------|--------|
| `config/clients/demo-static.yaml` | Static HTML + Nginx |
| `config/clients/demo-react-node.yaml` | React + Node API + PostgreSQL |
| `config/clients/demo-vue-python.yaml` | Vue + Python API + PostgreSQL + Redis |

## Profiles

- **small** — single VPS, all-in-one Compose
- **standard** — adds Redis/monitoring/backup patterns
- **resilient** — documented scale-out (LB, multi-instance) — optional Terraform

## Documentation

- `docs/architecture.md` — topology, proxy, BC integration points
- `docs/client-onboarding.md` — freelancer checklist
- `docs/configuration.md` — `client.yaml` reference
- `docs/deployment.md` — deploy/rollback/restart

## Future control plane (CLI today)

Documented operations mapping to future HTTP API: deploy, rollback, restart, health, status, backup, restore, logs — see `docs/architecture.md`.

## License

MIT
