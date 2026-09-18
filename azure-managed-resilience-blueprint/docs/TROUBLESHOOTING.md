# Troubleshooting

| Symptom | Check |
|---------|--------|
| Empty dashboard | Run **Sync**; confirm `AZURE_MOCK=true` or live permissions |
| 403 on API | Wrong tenant; customer token cannot access other `tenant_id` |
| Container App cold start | Wait 30–60s; hit `/api/v1/health` |
| Terraform Key Vault name conflict | Key vault names are global — change `name_prefix` |
| PostgreSQL connection | Firewall rule `0.0.0.0` allows Azure services; verify `DATABASE_URL` sslmode |
| Live sync NotImplemented | Set `AZURE_MOCK=true` or implement `_fetch_live` in `azure/collectors/sync.py` |
