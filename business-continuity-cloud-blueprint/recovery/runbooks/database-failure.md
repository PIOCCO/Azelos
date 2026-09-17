# Runbook: Database Failure

| Field | Value |
|-------|--------|
| Severity | SEV-1 |
| Affected service | PostgreSQL primary |
| Runbook ID | RB-DB-001 |

## Detection

- Azure Monitor alert on PostgreSQL connectivity / storage
- Application errors / health-check `database_connectivity` FAIL
- Backup job failures on database protection

## Containment

1. Enable read-only mode on application if partial corruption suspected.
2. Stop destructive migrations/deployments.
3. Preserve logs (`reports/incidents/` timeline via scripts).

## Decision point

| Condition | Action |
|-----------|--------|
| Transient outage | Failover to replica / restart |
| Data corruption | Point-in-time restore |
| Region loss | DR restore in secondary |

## Recovery action

```bash
export BCBP_MOCK_MODE=false
./scripts/restore.sh latest
# Or Azure Portal: PostgreSQL PITR to new server, update connection strings in Key Vault
```

## Validation

- `./scripts/health-check.sh`
- Integrity queries (row counts, checksum samples)
- `./scripts/recovery-test.sh` (scheduled)

## Service restoration

- Update App Service settings from Key Vault
- Confirm monitoring green

## Post-recovery

- Root cause analysis
- Update `business-continuity/rto-rpo.yaml` tested_results only from actual test
- `./automation/bcdr/scorecard.py`

## Evidence

- `reports/restore/restore-*.json`
- `reports/incidents/*/timeline.json`
