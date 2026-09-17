# Business Continuity & Disaster Recovery Cloud Blueprint (Azure)

Production-oriented, reusable blueprint for **small and medium SaaS** companies. Deployable with Terraform, operable with Bash automation, and aligned to explicit **RTO/RPO validation**, **recovery testing**, and **freelance client delivery**.

## What this is (and is not)

| Capability | Included |
|------------|----------|
| High Availability (in-region) | Partial (profile-dependent) |
| Backup & restore | Yes |
| Disaster Recovery (secondary region) | Yes — **active-passive** default |
| Business Continuity (people/process) | Templates + plan — not fully automated |
| Incident Response (security) | Runbooks + IR/DR separation |

**Backups alone do not provide business continuity.** This blueprint states that explicitly in code, docs, and validation output.

## Quick start

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit client.yaml and business-continuity/critical-assets.yaml
chmod +x scripts/*.sh

# Local validation (no Azure required)
BCBP_MOCK_MODE=true ./scripts/recovery-test.sh
python3 automation/bcdr/validate_rto_rpo.py
python3 automation/bcdr/scorecard.py

# Deploy (requires az login + subscription)
./scripts/deploy.sh dev
```

## Repository layout

See user-facing tree in `docs/deployment.md` — key paths:

- `client.yaml` — single client configuration driver
- `terraform/environments/{dev,production}` — deployable roots
- `scripts/` — backup, restore, failover, failback, health-check, recovery-test
- `business-continuity/` — BIA assets, RTO/RPO, capabilities
- `recovery/runbooks/` — scenario procedures
- `automation/bcdr/` — RTO/RPO validation, scorecard, tfvars rendering

## Default DR model

**Active-passive + backup/restore** (`standard` profile). Secondary region holds recovery storage and optional standby App Service (`resilient` / `standby_compute: true`). See `docs/architecture.md`.

## RTO/RPO validation

Three layers:

1. **Configured target** — `critical-assets.yaml` / `client.yaml`
2. **Estimated capability** — `validate_rto_rpo.py` + `architecture-capabilities.yaml`
3. **Tested result** — `recovery-test-report.json` only after real/mock controlled tests (never fabricated)

## Client delivery

Freelancers: read `docs/client-delivery.md` for checklist and handover artifacts.

## License

MIT — see `LICENSE`.
