# Atlas Azure Resilience

**Atlas Azure Resilience** is a cloud operations platform for monitoring Azure infrastructure, resilience, security posture, disaster recovery readiness, and cloud spending from a single operational dashboard.

Built for managed service providers serving SMEs, startups, and teams without dedicated Azure platform engineers.

## Problem it solves

Continuously answers: *What is misconfigured, unprotected, insecure, or wasteful in this subscription — and what should we do about it?*

Workflow:

```text
Detect → Explain → Recommend → Approve → Execute → Audit → Report
```

## Architecture

```text
React dashboard
      │
      ▼
FastAPI management API  ←→  PostgreSQL
      │
      ▼
Azure APIs (Resource Graph, Cost Management, …)
      │
Managed Identity (Azure deploy)
```

## Feature status

| Capability | Status |
|------------|--------|
| Multi-tenant API + RBAC | Implemented |
| Demo / simulated inventory (`DEMO_MODE`) | Implemented |
| Live Resource Graph + Cost (partial) | Partial |
| Backup / ASR / Defender live collectors | Planned |
| Resilience score (transparent formula) | Implemented |
| Sync runs + history | Implemented |
| Alerts ACK / resolve | Implemented |
| Branded PDF reports | Partial |
| Microsoft Entra ID | Planned (production guard in place) |
| Azure Container Apps deploy | Implemented |

## Local setup

```bash
cp .env.example .env
docker compose up --build
```

- UI: http://localhost:5175  
- API: http://localhost:8090/api/v1/health  
- Development operator: see `docs/DEPLOYMENT.md` (seeded credentials — **development only**)

## Azure deployment

```bash
./scripts/deploy.sh
```

Teardown (dev): `./scripts/destroy.sh`

## Documentation

See `docs/` — start with [ARCHITECTURE.md](docs/ARCHITECTURE.md), [AUTHENTICATION.md](docs/AUTHENTICATION.md), [AZURE_INTEGRATIONS.md](docs/AZURE_INTEGRATIONS.md), [COST.md](docs/COST.md), [PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md).

## Tests

```bash
PYTHONPATH=backend:. APP_ENV=test python -m pytest tests -q
```

## Security model

- Tenant isolation enforced server-side (`docs/MULTI_TENANCY.md`)
- No automatic destructive Azure actions
- Production startup rejects insecure defaults (`ENVIRONMENT=production`)

## Cost model

Platform hosting vs customer Azure spend — see [docs/COST.md](docs/COST.md).
