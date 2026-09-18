# Azure Managed Resilience & FinOps Blueprint

Standalone, production-oriented platform for **Azure Managed Infrastructure & Resilience** — multi-tenant discovery, backup/DR/security/cost monitoring, evidence-based recommendations, approval-gated actions, and monthly reports.

Designed for ~**$200/month MVP** credit (scale-to-zero Container Apps, Burstable PostgreSQL). Works **without a custom domain** (`*.azurecontainerapps.io`).

## Quick start (local)

```bash
cp .env.example .env
docker compose up --build
```

- Dashboard: http://localhost:5175  
- API: http://localhost:8090/api/v1/health  
- Provider login: `provider@example.com` / `Provider123!`

Run **discovery sync** from the sidebar to refresh demo inventory (VM-02 unprotected, VM-03 high CPU, cost anomaly).

## Azure deploy

```bash
./scripts/deploy.sh
```

See `docs/DEPLOYMENT.md`, `docs/COST.md`, `docs/AZURE_PERMISSIONS.md`.

## Documentation

| Doc | Topic |
|-----|--------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Components & data flow |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local & Azure |
| [COST.md](docs/COST.md) | MVP cost & shutdown |
| [AZURE_PERMISSIONS.md](docs/AZURE_PERMISSIONS.md) | RBAC for managed identity |
| [LIGHTHOUSE.md](docs/LIGHTHOUSE.md) | Customer onboarding |
| [SECURITY.md](docs/SECURITY.md) | Controls |
| [OPERATIONS.md](docs/OPERATIONS.md) | Run sync, health |
| [API.md](docs/API.md) | REST reference |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues |
| [SERVICE_MODEL.md](SERVICE_MODEL.md) | Commercial packaging |

## Stack

- **Backend**: Python FastAPI, PostgreSQL  
- **Frontend**: React + TypeScript + Vite  
- **IaC**: Terraform modules under `terraform/modules/`  
- **Azure**: Container Apps, ACR, PostgreSQL Flexible, Monitor, App Insights, Budget  

## Tests

```bash
PYTHONPATH=backend:. APP_ENV=test python -m pytest tests -q
```

## Live Azure

Set `AZURE_MOCK=false`, assign roles per `docs/AZURE_PERMISSIONS.md`, extend `azure/collectors/sync.py` (`_fetch_live`) with Resource Graph + Cost Management APIs.
