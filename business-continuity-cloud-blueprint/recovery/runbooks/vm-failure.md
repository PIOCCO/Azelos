# Runbook: VM / Compute Failure

| Field | Value |
|-------|--------|
| Severity | SEV-2 |
| Affected service | App Service / VM workload |
| Runbook ID | RB-VM-001 |

## Detection

- Platform health alert, instance restart loop
- `./scripts/health-check.sh` FAIL on HTTPS/application

## Containment

- Scale out / restart app plan instance
- Isolate compromised instance if security suspected

## Decision point

- App Service platform issue → Microsoft status + redeploy
- Bad deployment → rollback release (see application-failure.md)
- Host compromise → ransomware runbook

## Recovery

```bash
./scripts/deploy.sh dev  # redeploy infrastructure/app from known-good IaC
./scripts/health-check.sh
```

Azure Backup VM restore when using IaaS VMs protected by Recovery Services vault.

## Validation

- Health checks PASS (not HTTP 200 alone)
- Synthetic transaction test (client-defined)

## Evidence

- Deployment logs, backup job IDs, timeline JSON
