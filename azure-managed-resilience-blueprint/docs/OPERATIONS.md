# Operations

## Scheduled discovery

Run sync on a schedule (Container Apps Job or GitHub Actions):

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "$API/api/v1/sync?tenant_id=tenant-demo"
```

## Health

- API: `GET /api/v1/health`
- Application Insights: request failures, latency

## Backups

- Platform DB: PostgreSQL automated backups (7 days default module).
- Customer backup **monitoring** is read-only; remediation via approved runbooks.

## DR

- ASR status from collectors; recovery objectives in `recovery_objectives` table (configure per tenant).

## Incident flow

Alerts in dashboard → operator triage → recommendation → approve → execute recorded action.
