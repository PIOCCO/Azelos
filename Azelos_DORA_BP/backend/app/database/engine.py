"""SQLAlchemy engine factory (lazy singleton, resettable for tests)."""

from __future__ import annotations

from sqlalchemy import Engine, create_engine

from app.config.database import DatabaseSettings, create_engine_kwargs, load_database_settings

_engine: Engine | None = None
_engine_settings: DatabaseSettings | None = None


def get_engine(*, settings: DatabaseSettings | None = None) -> Engine:
    global _engine, _engine_settings
    if settings is not None:
        _engine_settings = settings
        _engine = create_engine(**create_engine_kwargs(settings))
        return _engine
    if _engine is None:
        _engine_settings = load_database_settings()
        _engine = create_engine(**create_engine_kwargs(_engine_settings))
    return _engine


def reset_engine() -> None:
    """Dispose engine (use in tests when DATABASE_URL changes)."""
    global _engine, _engine_settings
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _engine_settings = None
    from app.database.session import reset_session_factory

    reset_session_factory()
