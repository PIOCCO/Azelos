"""Database session factory."""

from collections.abc import Generator

from sqlalchemy.orm import Session, sessionmaker

from app.database.engine import get_engine

_SessionLocal: sessionmaker[Session] | None = None


def _session_factory() -> sessionmaker[Session]:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            bind=get_engine(), autocommit=False, autoflush=False
        )
    return _SessionLocal


def SessionLocal() -> Session:
    """Create a new ORM session (callers must close/commit)."""
    return _session_factory()()


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def reset_session_factory() -> None:
    global _SessionLocal
    _SessionLocal = None
