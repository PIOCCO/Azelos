"""DORA overview aggregate API."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.enums import CriticalOrImportant
from app.models.financial_entity import FinancialEntity


@pytest.fixture
def client(db_session):
    from app.core.database import get_db
    from app.main import create_app

    def _override():
        yield db_session

    app = create_app()
    app.dependency_overrides[get_db] = _override
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_dora_overview_returns_tenant_counts(client, db_session):
    org = FinancialEntity(legal_name="Overview Bank", country_code="FR", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(
        email="overview@test.com",
        hashed_password=hash_password("pass"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id,
            financial_entity_id=org.id,
            role=Role.ORG_ADMIN,
        )
    )
    db_session.flush()

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "overview@test.com",
            "password": "pass",
            "organization_id": str(org.id),
        },
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    bf = client.post(
        "/api/v1/business-functions",
        headers=headers,
        json={
            "name": "Core",
            "function_identifier": "C-1",
            "critical_or_important": CriticalOrImportant.CRITICAL.value,
        },
    )
    assert bf.status_code == 201

    resp = client.get("/api/v1/dora/overview", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["business_functions_total"] == 1
    assert data["business_functions_critical"] == 1
    assert "resilience" in data
    assert data["incidents_module_available"] is True
    assert data["incidents_total"] == 0
