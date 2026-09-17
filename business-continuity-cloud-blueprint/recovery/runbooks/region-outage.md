# Runbook: Regional Azure Outage

| Runbook ID | RB-REG-001 |

## Detection

- Azure Status communication
- Multi-service alerts in primary region
- Secondary region health-check PASS while primary FAIL

## Containment

- Communicate BC degraded mode (status page)
- Freeze primary-region changes

## Decision

- Outage exceeds declared RTO → initiate failover
- Partial outage → route around with Front Door / Traffic Manager (client-specific)

## Recovery

```bash
./scripts/failover.sh --dry-run
./scripts/failover.sh
```

Provision secondary compute if profile `minimal` (cold DR):

```bash
BCBP_ENV=production ./scripts/deploy.sh production
```

## Failback

When primary region stable:

```bash
./scripts/failback.sh
```

## Evidence

- `reports/failover-last.json`, `reports/failback-last.json`
