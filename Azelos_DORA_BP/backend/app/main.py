import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes.config import router as legacy_config_router
from app.api.v1.router import api_v1_router
from app.graphql.router import create_graphql_router
from app.core.config import get_settings
from app.core.database import check_database_connectivity
from app.core.exceptions import register_exception_handlers
from app.core.logging import RequestLoggingMiddleware


def create_app() -> FastAPI:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="DORA Blueprint — core + configuration API over PostgreSQL",
    )
    register_exception_handlers(app)
    app.add_middleware(RequestLoggingMiddleware)
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins != ["*"] else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)
    app.include_router(create_graphql_router(), prefix="/graphql")
    app.include_router(legacy_config_router)  # backward compatible header-auth config

    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "alive"}

    @app.get("/ready", tags=["Health"])
    def ready():
        ok = check_database_connectivity()
        return {"status": "ready" if ok else "degraded", "database": ok}

    if not _maybe_mount_frontend(app):
        @app.get("/", include_in_schema=False)
        def root_api_only():
            return PlainTextResponse(
                "DORA Blueprint API is running.\n\n"
                "The web UI is not mounted. Build the frontend and restart with the startup script:\n"
                "  ./scripts/start-web-one-port.sh\n\n"
                "Or export SERVE_FRONTEND=1 after: cd frontend && npm run build\n\n"
                "API docs: /docs\n"
                "Health: /health\n",
            )

    return app


def _frontend_dist_dir() -> Path:
    here = Path(__file__).resolve()
    candidates = [
        here.parents[2] / "frontend" / "dist",  # repo: Azelos_DORA_BP/frontend/dist
        here.parents[1] / "frontend" / "dist",  # Docker: /app/frontend/dist
    ]
    for path in candidates:
        if (path / "index.html").is_file():
            return path
    return candidates[0]


def _maybe_mount_frontend(app: FastAPI) -> bool:
    """Serve built React app from ../frontend/dist when enabled or build is present."""
    flag = os.getenv("SERVE_FRONTEND", "").strip().lower()
    dist = _frontend_dist_dir()
    index = dist / "index.html"

    if flag in ("0", "false", "no", "off"):
        return False
    if os.getenv("DISABLE_FRONTEND_STATIC", "").strip().lower() in ("1", "true", "yes", "on"):
        return False

    explicit = flag in ("1", "true", "yes", "on")
    if not index.is_file():
        if explicit:
            import logging

            logging.getLogger("app.main").warning(
                "SERVE_FRONTEND is set but %s is missing — run: cd frontend && npm run build",
                index,
            )
        return False

    # Explicit SERVE_FRONTEND=1 or auto-serve when dist exists (one-port local dev)
    assets = dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="frontend-assets")
    app.mount("/", StaticFiles(directory=dist, html=True), name="frontend")
    import logging

    logging.getLogger("app.main").info("Serving web UI from %s", dist)
    return True


app = create_app()
