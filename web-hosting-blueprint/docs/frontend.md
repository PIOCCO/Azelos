# Frontend module

Configure `frontend.framework` and `frontend.source.build_context`.

Build patterns live under `frontend/examples/` and `frontend/docker/`.

Static/SPA: multi-stage build → Nginx. SSR (Next.js): use `Dockerfile.ssr` in client context.

Health: Nginx `/` or app-specific path in `frontend.health_path` (optional extension).
