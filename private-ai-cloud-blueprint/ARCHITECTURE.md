# Architecture

```text
Admin Web + Admin Desktop (Flutter) / Employee Client (Flutter + Web)
              ↓ TLS
         Reverse Proxy
              ↓
            API (FastAPI)
    ┌─────────┼─────────┐
    ↓         ↓         ↓
PostgreSQL  Redis     MinIO
+ pgvector   queue    objects
    ↑
 Worker (Celery) — extract → chunk → embed → index
    ↓
 LLM (Ollama / vLLM / mock) — RAG answers + citations
```

Permission filter runs **before** vector search — unauthorized chunks are never retrieved.

Multi-tenant: `tenant_id` on all rows; no cross-tenant queries.

Optional fine-tuning: see `fine-tuning/` (separate from RAG).
