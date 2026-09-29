import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.rbac import Role
from app.core.passwords import hash_password
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity
from app.models.provider import ICTProvider
from app.models.enums import ProviderStatus, ProviderType


@pytest.fixture
def org_a(db_session):
    fe = FinancialEntity(
        legal_name="Bank A",
        country_code="DE",
        status="active",
    )
    db_session.add(fe)
    db_session.flush()
    return fe


@pytest.fixture
def org_b(db_session):
    fe = FinancialEntity(
        legal_name="Bank B",
        country_code="FR",
        status="active",
    )
    db_session.add(fe)
    db_session.flush()
    return fe


@pytest.fixture
def user_a(db_session, org_a):
    user = User(
        email="user-a@example.com",
        hashed_password=hash_password("secret123"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id,
            financial_entity_id=org_a.id,
            role=Role.SECURITY_MANAGER,
        )
    )
    db_session.flush()
    return user


@pytest.fixture
def client(db_session):
    from app.core.database import get_db
    from app.main import create_app

    def _override_get_db():
        yield db_session

    app = create_app()
    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _token(client, email, password, org_id):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "organization_id": str(org_id)},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_login_and_tenant_isolation(client, user_a, org_a, org_b, db_session):
    supplier_b = ICTProvider(
        financial_entity_id=org_b.id,
        legal_name="Provider B",
        country_code="FR",
        provider_type=ProviderType.ICT_THIRD_PARTY,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(supplier_b)
    db_session.flush()

    token = _token(client, "user-a@example.com", "secret123", org_a.id)
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get(f"/api/v1/ict-providers/{supplier_b.id}", headers=headers)
    assert r.status_code == 404


def test_health_ready(client):
    assert client.get("/health").json()["status"] == "alive"
    assert client.get("/ready").json()["database"] is True


def test_extension_registration_no_sql_endpoint(client, user_a, org_a):
    token = _token(client, "user-a@example.com", "secret123", org_a.id)
    headers = {"Authorization": f"Bearer {token}"}
    assert client.post("/api/v1/execute-sql", json={"sql": "DROP TABLE users"}).status_code == 404
    r = client.post(
        "/api/v1/extensions",
        headers=headers,
        json={"name": "custom-reporting", "version": "1.0.0"},
    )
    assert r.status_code == 403  # SECURITY_MANAGER cannot register extensions


def test_invalid_login(client, user_a, org_a):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "user-a@example.com", "password": "wrong", "organization_id": str(org_a.id)},
    )
    assert r.status_code == 401
