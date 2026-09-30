import logging
import os
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.api.routes.config import router as legacy_config_router
from app.core.spa_fallback import register_spa_routes
from app.api.v1.router import api_v1_router
from app.graphql.router import create_graphql_router
from app.core.config import get_settings
from app.core.database import check_database_connectivity, get_db
from app.core.exceptions import register_exception_handlers
from app.core.logging import RequestLoggingMiddleware
from app.core.production_validation import validate_production_settings
from app.core.rate_limit import RateLimitMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.core.subscription_gate import SubscriptionGateMiddleware


def _maybe_auto_migrate_schema() -> None:
    """Apply pending Alembic revisions when AUTO_MIGRATE_DB is enabled (default on)."""
    flag = os.getenv("AUTO_MIGRATE_DB", "1").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return
    backend_dir = Path(__file__).resolve().parents[1]
    log = logging.getLogger("app.main")
    log.info("Checking for pending database migrations…")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        log.error(
            "Alembic upgrade failed (run manually: cd backend && python -m alembic upgrade head):\n%s",
            result.stderr or result.stdout,
        )
    elif result.stdout.strip():
        log.info("Database migrations applied:\n%s", result.stdout.strip())

    settings_peek = get_settings()
    repair_default = "0" if settings_peek.app_env.lower() == "production" else "1"
    if os.getenv("REPAIR_RISK_SCHEMA", repair_default).strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    ):
        try:
            from app.core.database import SessionLocal
            from app.core.schema_health import repair_risk_lifecycle_columns, risk_lifecycle_columns_present

            with SessionLocal() as session:
                if not risk_lifecycle_columns_present(session):
                    log.warning("Risk lifecycle columns missing — attempting idempotent repair…")
                    if repair_risk_lifecycle_columns(session):
                        log.info("Risk lifecycle columns repaired successfully.")
                    else:
                        log.error(
                            "Could not repair schema. Run: cd backend && python -m alembic upgrade head"
                        )
        except Exception:
            log.exception("Schema repair check failed")


def create_app() -> FastAPI:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    settings = get_settings()
    if os.getenv("AUTO_MIGRATE_DB") is None and settings.app_env.lower() == "production":
        os.environ["AUTO_MIGRATE_DB"] = "0"
    _maybe_auto_migrate_schema()
    validate_production_settings(settings)
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="DORA Blueprint — core + configuration API over PostgreSQL",
    )
    register_exception_handlers(app)
    app.add_middleware(SubscriptionGateMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
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
    def ready(db: Session = Depends(get_db)):
        from app.core.schema_health import schema_migration_status

        db_ok = check_database_connectivity()
        schema = schema_migration_status(db)
        ok = db_ok and schema["ok"]
        payload = {
            "status": "ready" if ok else "degraded",
            "database": db_ok,
            "schema": schema,
        }
        if not schema["ok"]:
            payload["message"] = (
                "Database schema is behind application code. "
                + (schema.get("fix_hint") or "Run Alembic migrations.")
            )
        return payload

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

    # Explicit catch-all: client routes (e.g. /risks) → index.html; API stays on registered routers.
    register_spa_routes(app, dist)
    import logging

    logging.getLogger("app.main").info("Serving web UI from %s", dist)
    return True


app = create_app()
