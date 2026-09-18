# Troubleshooting

| Issue | Check |
|-------|--------|
| Document stuck PROCESSING | Worker logs, Redis, MinIO connectivity |
| Empty citations | Permissions, INDEXED status, department ACL |
| LLM errors | Ollama URL, model pulled, use LLM_MOCK for dev |
| pgvector errors | Postgres image `pgvector/pgvector:pg16` |
