# Sync worker

Use Azure Container Apps Jobs or cron to POST `/api/v1/sync` per tenant.

Example (hourly):

```bash
*/60 * * * * curl -sf -X POST -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  "${AMRF_API}/api/v1/sync?tenant_id=${TENANT_ID}"
```

Do not embed subscription keys; use managed identity + API auth in production.
