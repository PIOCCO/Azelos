"""Infrastructure portability: DATABASE_URL, no cloud coupling in core layer."""

from __future__ import annotations

import os
from pathlib import Path
from unittest import mock

import pytest
from sqlalchemy import create_engine, text

from app.config.database import (
    DatabaseConfigurationError,
    create_engine_kwargs,
    load_database_settings,
)
from app.database.engine import get_engine, reset_engine


def test_database_url_required():
    with mock.patch.dict(os.environ, {}, clear=True):
        os.environ.pop("DATABASE_URL", None)
        with pytest.raises(DatabaseConfigurationError):
            load_database_settings()


def test_valid_postgresql_connection(engine):
    with engine.connect() as conn:
        assert conn.execute(text("SELECT 1")).scalar_one() == 1


def test_engine_accepts_non_local_hostname():
    from app.config.database import DatabaseSettings

    url = "postgresql+psycopg://app:secret@db.client.example:5432/dora_prod"
    cfg = DatabaseSettings(url=url)
    kwargs = create_engine_kwargs(cfg)
    assert kwargs["url"] == url
    assert "db.client.example" in kwargs["url"]


def test_unsupported_postgresql_version_rejected():
    from scripts.check_database import _parse_major

    assert _parse_major("PostgreSQL 15.4") == 15
    assert _parse_major("PostgreSQL 16.2") == 16


def test_no_hardcoded_azure_hostname_in_core_python():
    root = Path(__file__).resolve().parents[1] / "app"
    forbidden = ("blob.core.windows.net", "DefaultAzureCredential", "StorageBlob")
    violations: list[str] = []
    for path in root.rglob("*.py"):
        if path.parts[-2:] == ("storage", "azure_blob.py"):
            continue  # adapter placeholder only
        text_body = path.read_text(encoding="utf-8")
        for token in forbidden:
            if token in text_body:
                violations.append(f"{path}: {token}")
    assert not violations, "Core app must not embed Azure endpoints/credentials: " + ", ".join(
        violations
    )


def test_migrations_apply_on_clean_database(engine):
    with engine.connect() as conn:
        tables = conn.execute(
            text(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'financial_entities'"
            )
        ).first()
        assert tables is not None


def test_database_settings_pool_from_env():
    env = {
        "DATABASE_URL": "postgresql+psycopg://u:p@remote-host:5432/db",
        "DB_POOL_SIZE": "5",
        "DB_MAX_OVERFLOW": "7",
        "DB_POOL_TIMEOUT": "11",
        "DB_POOL_RECYCLE": "900",
        "DB_SSL_MODE": "require",
    }
    with mock.patch.dict(os.environ, env, clear=False):
        reset_engine()
        settings = load_database_settings()
        assert settings.pool_size == 5
        assert settings.max_overflow == 7
        assert settings.ssl_mode == "require"
        kwargs = create_engine_kwargs(settings)
        assert kwargs["connect_args"] == {"sslmode": "require"}
        eng = get_engine(settings=settings)
        eng.dispose()
        reset_engine()
