# Runbook: Application / Corrupted Deployment Failure

| Runbook ID | RB-APP-001 |

## Detection

- Health check WARNING/FAIL after release
- Error rate spike in Application Insights

## Containment

- Roll back App Service deployment slot
- Disable feature flags

## Decision

- Bad build → rollback
- Schema mismatch → DB migration runbook
- Data corruption → database-failure.md

## Recovery

```bash
# Redeploy last known-good IaC + container tag
./scripts/deploy.sh production
./scripts/health-check.sh
```

## Validation

- API contract tests
- `./scripts/recovery-test.sh`

## Evidence

- Release ID, deployment logs, health JSON
