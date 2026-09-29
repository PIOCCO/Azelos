"""API integration: auth, RBAC hints, tenant isolation, no SQL endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.core.rbac import Role
from app.core.passwords import hash_password
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity
from app.models.provider import ICTProvider
from app.models.enums import ProviderStatus, ProviderType


@pytest.fixture
def client(db_session):
    from app.core.database import get_db
    from app.main import create_app

    app = create_app()

    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    yield TestClient(app)
    app.dependency_overrides.clear()


def _login(client, email, password, org_id):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "organization_id": str(org_id)},
    )


@pytest.fixture
def two_orgs_users(client, db_session):
    org_a = FinancialEntity(legal_name="Sec A", country_code="DE", status="active")
    org_b = FinancialEntity(legal_name="Sec B", country_code="FR", status="active")
    db_session.add_all([org_a, org_b])
    db_session.flush()
    user = User(email="sec@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org_a.id, role=Role.ORG_ADMIN)
    )
    db_session.flush()
    prov_b = ICTProvider(
        financial_entity_id=org_b.id,
        legal_name="Hidden",
        country_code="FR",
        provider_type=ProviderType.ICT_THIRD_PARTY,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(prov_b)
    db_session.flush()
    return user, org_a, org_b, prov_b


def test_missing_auth_401(client):
    assert client.get("/api/v1/ict-providers").status_code == 401


def test_invalid_token_401(client):
    r = client.get(
        "/api/v1/ict-providers",
        headers={"Authorization": "Bearer not-a-valid-jwt"},
    )
    assert r.status_code == 401


def test_cross_tenant_provider_404(client, two_orgs_users):
    user, org_a, _org_b, prov_b = two_orgs_users
    login = _login(client, user.email, "pass", org_a.id)
    assert login.status_code == 200
    token = login.json()["access_token"]
    r = client.get(
        f"/api/v1/ict-providers/{prov_b.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404


def test_no_execute_sql_endpoint(client, two_orgs_users):
    user, org_a, _, _ = two_orgs_users
    login = _login(client, user.email, "pass", org_a.id)
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.post("/api/v1/execute-sql", json={"sql": "select 1"}, headers=headers).status_code == 404


def test_xss_payload_stored_as_data(client, two_orgs_users):
    user, org_a, _, _ = two_orgs_users
    login = _login(client, user.email, "pass", org_a.id)
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    payload = "<script>alert(1)</script>"
    r = client.post(
        "/api/v1/business-functions",
        headers=headers,
        json={
            "name": payload,
            "function_identifier": "XSS-1",
            "critical_or_important": "neither",
        },
    )
    assert r.status_code == 201
    assert r.json()["name"] == payload
