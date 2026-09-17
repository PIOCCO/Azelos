# Operations

## Daily

- Review backup freshness alert (see `monitoring/queries/backup-freshness.kql`)
- Check Application Insights availability

## Weekly

- `./scripts/health-check.sh`
- Review failed backups in Recovery Services vault

## Monthly

- `./scripts/recovery-test.sh` (mock or isolated sandbox subscription)
- Update `readiness-report.json` via scorecard

## Incident flow

1. Detect (monitoring / health checks)
2. Open incident timeline (automatic when using `scripts/failover.sh`, `restore.sh`, etc.)
3. Follow scenario runbook under `recovery/runbooks/`
4. Confirm restoration with health checks — not HTTP 200 alone
5. Post-incident: scorecard + evidence archive

## Failover / failback

```bash
./scripts/failover.sh --dry-run
./scripts/failover.sh          # requires typing YES
./scripts/failback.sh --dry-run
```
