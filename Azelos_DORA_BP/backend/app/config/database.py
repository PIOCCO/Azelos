"""PostgreSQL connection settings — hosting-agnostic, fully environment-driven."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

MIN_POSTGRESQL_MAJOR = 16


class DatabaseConfigurationError(ValueError):
    """Missing or invalid database configuration."""


@dataclass(frozen=True)
class DatabaseSettings:
    url: str
    pool_size: int = 10
    max_overflow: int = 20
    pool_timeout: int = 30
    pool_recycle: int = 1800
    ssl_mode: str | None = None

    def masked_url(self) -> str:
        """URL safe for logs (password redacted)."""
        parsed = urlparse(self.url)
        if parsed.password:
            netloc = parsed.hostname or ""
            if parsed.port:
                netloc = f"{netloc}:{parsed.port}"
            if parsed.username:
                netloc = f"{parsed.username}:***@{netloc}"
            return parsed._replace(netloc=netloc).geturl()
        return self.url

    def connect_args(self) -> dict[str, Any]:
        if not self.ssl_mode:
            return {}
        return {"sslmode": self.ssl_mode}


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return int(raw)


def load_database_settings(*, require_url: bool = True) -> DatabaseSettings:
    url = os.getenv("DATABASE_URL", "").strip()
    if require_url and not url:
        raise DatabaseConfigurationError(
            "DATABASE_URL is required (postgresql+psycopg://user:pass@host:5432/dbname)"
        )
    if not require_url and not url:
        url = "postgresql+psycopg://@/"

    return DatabaseSettings(
        url=url,
        pool_size=_int_env("DB_POOL_SIZE", 10),
        max_overflow=_int_env("DB_MAX_OVERFLOW", 20),
        pool_timeout=_int_env("DB_POOL_TIMEOUT", 30),
        pool_recycle=_int_env("DB_POOL_RECYCLE", 1800),
        ssl_mode=os.getenv("DB_SSL_MODE") or None,
    )


def create_engine_kwargs(
    settings: DatabaseSettings, *, for_migrations: bool = False
) -> dict[str, Any]:
    kwargs: dict[str, Any] = {
        "url": settings.url,
        "connect_args": settings.connect_args(),
    }
    if for_migrations:
        from sqlalchemy.pool import NullPool

        kwargs["poolclass"] = NullPool
        return kwargs
    kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_size": settings.pool_size,
            "max_overflow": settings.max_overflow,
            "pool_timeout": settings.pool_timeout,
            "pool_recycle": settings.pool_recycle,
        }
    )
    return kwargs
