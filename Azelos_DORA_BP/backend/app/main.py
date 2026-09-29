from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.config import router as legacy_config_router
from app.api.v1.router import api_v1_router
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
    app.include_router(legacy_config_router)  # backward compatible header-auth config

    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "alive"}

    @app.get("/ready", tags=["Health"])
    def ready():
        ok = check_database_connectivity()
        return {"status": "ready" if ok else "degraded", "database": ok}

    return app


app = create_app()
