from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv

from alembic import context
from app.config.database import load_database_settings, create_engine_kwargs

# Match FastAPI: load backend/.env (and optional repo-root .env) before DATABASE_URL is read.
_backend_dir = Path(__file__).resolve().parents[1]
load_dotenv(_backend_dir / ".env")
load_dotenv(_backend_dir.parent / ".env")
from app.database.base import Base
from app.models import *  # noqa: F401, F403 — register metadata
from sqlalchemy import create_engine

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Single source of truth: DATABASE_URL (never a hard-coded host in alembic.ini).
_settings = load_database_settings()
config.set_main_option("sqlalchemy.url", _settings.url)

target_metadata = Base.metadata


def get_connectable():
    settings = load_database_settings()
    return create_engine(**create_engine_kwargs(settings, for_migrations=True))


def run_migrations_offline() -> None:
    settings = load_database_settings()
    context.configure(
        url=settings.url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = get_connectable()
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
