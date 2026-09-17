# Runbook: Storage Failure

| Runbook ID | RB-STO-001 |

## Detection

- Blob 5xx metrics, backup copy failures
- Health-check storage WARNING/FAIL

## Recovery

- Failover to GRS secondary read access (if enabled)
- Restore containers from Recovery Services vault / backup tarball from `reports/backups/artifacts/`

```bash
./scripts/restore.sh latest
```

## Evidence

- Storage metrics, restore report
