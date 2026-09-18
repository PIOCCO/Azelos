# Private AI Cloud Blueprint

**RAG + private/self-hosted LLM** platform for company knowledge — not foundation-model training.

Employees ask questions; the system retrieves **only authorized** document chunks, then a **private LLM** answers with **citations**.

## Quick start (local)

```bash
cp .env.example .env
docker compose up --build -d
# API: http://localhost:8080/api/v1/health
# Admin web UI: http://localhost:5173
# Admin desktop: see admin-app/README.md (Flutter)
# Employee UI: http://localhost:5174
```

Default admin (seeded): `admin@company.local` / `admin123!`

## Acceptance test

```bash
docker compose exec api env RUN_PAIC_INTEGRATION=1 pytest /app/backend/../tests/integration -q
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [SECURITY.md](SECURITY.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [OPERATIONS.md](OPERATIONS.md)
- [API.md](API.md)
- [COST.md](COST.md)
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Profiles

See `config/profiles.yaml` — `dev`, `small`, `medium`, `enterprise`, `on-prem`.

## Privacy

**RAG ≠ model training.** Documents stay in your environment; embeddings are deleted when documents are removed from active knowledge.

## License

MIT
