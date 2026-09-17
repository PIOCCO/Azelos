# Configuration

Primary file: `config/clients/<client>.yaml` (see `config/client.example.yaml`).

Validation:

```bash
WHBP_CLIENT_CONFIG=config/clients/demo-static.yaml ./deployment/validate-config.sh
```

Environment guardrails merge from `config/environments/<type>.yaml`:

- Development forbids production-like domains (use `*.local`)
- Production requires `WHBP_PRODUCTION_APPROVED=true` for deploy script

Framework matrix:

| frontend.framework | Runtime |
|--------------------|---------|
| static, react, vue | Build → Nginx |
| nextjs | Node SSR (`Dockerfile.ssr`) |

| backend.framework | Template |
|-------------------|----------|
| node, python, go, php | `backend/examples/<framework>/Dockerfile` |

Redis deploys **only** when `redis.enabled: true`.
