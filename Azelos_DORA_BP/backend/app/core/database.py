"""Database session dependency (reuses existing engine)."""

from collections.abc import Generator

from sqlalchemy import event, text
from sqlalchemy.orm import Session

from app.core.schemas_pg import DORA_CONFIG_SCHEMA, DORA_CORE_SCHEMA, CLIENT_EXTENSIONS_SCHEMA
from app.database.engine import get_engine
from app.database.session import SessionLocal

_engine_configured = False


def _configure_search_path() -> None:
    global _engine_configured
    if _engine_configured:
        return
    engine = get_engine()

    @event.listens_for(engine, "connect")
    def _set_search_path(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute(
            f"SET search_path TO {DORA_CORE_SCHEMA}, {DORA_CONFIG_SCHEMA}, "
            f"{CLIENT_EXTENSIONS_SCHEMA}, public"
        )
        cursor.close()

    _engine_configured = True


def get_db() -> Generator[Session, None, None]:
    _configure_search_path()
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def check_database_connectivity() -> bool:
    _configure_search_path()
    with get_engine().connect() as conn:
        conn.execute(text("SELECT 1"))
    return True
