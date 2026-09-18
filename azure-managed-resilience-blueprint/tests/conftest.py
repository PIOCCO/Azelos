import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("AZURE_MOCK", "true")
os.environ.setdefault("JWT_SECRET", "test")
os.environ.setdefault("APP_ENV", "test")

from app.db.session import Base, SessionLocal, engine, get_db, init_db  # noqa: E402
from app.main import app, seed  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    init_db()
    seed()

    def override():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
