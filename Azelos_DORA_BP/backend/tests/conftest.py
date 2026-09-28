import os

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.models import *  # noqa: F401, F403

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://dora:dora@localhost:5432/dora_supplier_risk_test",
    ),
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

    eng = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("script_location", "alembic")
    command.upgrade(alembic_cfg, "head")
    yield eng
    eng.dispose()


@pytest.fixture
def db_session(engine) -> Session:
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection, autocommit=False, autoflush=False)()
    yield session
    session.close()
    transaction.rollback()
    connection.close()
