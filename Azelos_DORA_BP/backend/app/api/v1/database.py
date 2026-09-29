from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import check_database_connectivity, get_db
from app.core.schemas_pg import CLIENT_EXTENSIONS_SCHEMA, DORA_CONFIG_SCHEMA, DORA_CORE_SCHEMA
from app.core.version import (
    APPLICATION_VERSION,
    DORA_CONFIG_SCHEMA_VERSION,
    DORA_CORE_SCHEMA_VERSION,
)

router = APIRouter(prefix="/database", tags=["Database"])


@router.get("/health", summary="Database connectivity probe")
def database_health():
    healthy = check_database_connectivity()
    return {"status": "healthy" if healthy else "unhealthy", "database": "postgresql"}


@router.get("/status", summary="Safe database status (no secrets)")
def database_status(db: Session = Depends(get_db)):
    rev = db.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).scalar()
    ext_exists = db.execute(
        text(
            "SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = :s)"
        ),
        {"s": CLIENT_EXTENSIONS_SCHEMA},
    ).scalar()
    return {
        "status": "healthy",
        "database": "postgresql",
        "application_version": APPLICATION_VERSION,
        "schema_versions": {
            "alembic_revision": rev,
            "dora_core": DORA_CORE_SCHEMA_VERSION,
            "dora_config": DORA_CONFIG_SCHEMA_VERSION,
            "dora_core_schema": DORA_CORE_SCHEMA,
            "dora_config_schema": DORA_CONFIG_SCHEMA,
        },
        "extensions_schema": "available" if ext_exists else "not_created",
    }
