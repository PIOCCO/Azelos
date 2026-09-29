import os

# Prevent StaticFiles mount from intercepting API routes during pytest (405 on POST).
os.environ.setdefault("DISABLE_FRONTEND_STATIC", "1")

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

from app.database.engine import reset_engine

# Tests require DATABASE_URL (or TEST_DATABASE_URL which is copied to DATABASE_URL).
if not os.getenv("DATABASE_URL"):
    test_url = os.getenv("TEST_DATABASE_URL")
    if test_url:
        os.environ["DATABASE_URL"] = test_url


TEST_DATABASE_URL = os.getenv("DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError(
        "Set DATABASE_URL or TEST_DATABASE_URL before running pytest "
        "(see Azelos_DORA_BP/.env.example)."
    )


@pytest.fixture(scope="session")
def engine():
    admin_url = TEST_DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
    db_name = TEST_DATABASE_URL.rsplit("/", 1)[-1]
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": db_name},
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    admin_engine.dispose()

    reset_engine()
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    from app.config.database import load_database_settings, create_engine_kwargs

    eng = create_engine(**create_engine_kwargs(load_database_settings()))
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("script_location", "alembic")
    command.upgrade(alembic_cfg, "head")
    yield eng
    eng.dispose()
    reset_engine()


@pytest.fixture
def db_session(engine):
    from sqlalchemy.orm import Session, sessionmaker

    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection, autocommit=False, autoflush=False)()
    yield session
    session.close()
    transaction.rollback()
    connection.close()
