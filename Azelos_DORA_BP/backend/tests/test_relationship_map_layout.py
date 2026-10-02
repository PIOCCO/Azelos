import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity


@pytest.fixture
def two_orgs(db_session):
    a = FinancialEntity(legal_name="Org A", country_code="DE", status="active")
    b = FinancialEntity(legal_name="Org B", country_code="FR", status="active")
    db_session.add_all([a, b])
    db_session.flush()
    return a, b


@pytest.fixture
def users_two_orgs(db_session, two_orgs):
    org_a, org_b = two_orgs
    user_a = User(email="layout-a@test.com", hashed_password=hash_password("pass"), is_active=True)
    user_b = User(email="layout-b@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add_all([user_a, user_b])
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user_a.id, financial_entity_id=org_a.id, role=Role.USER)
    )
    db_session.add(
        OrganizationMembership(user_id=user_b.id, financial_entity_id=org_b.id, role=Role.USER)
    )
    db_session.flush()
    return (user_a, org_a), (user_b, org_b)


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


def _login(client, email, org_id):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "pass", "organization_id": str(org_id)},
    )
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_layout_empty_by_default(client, users_two_orgs):
    (_, org_a), _ = users_two_orgs
    headers = _login(client, "layout-a@test.com", org_a.id)
    r = client.get("/api/v1/dora/relationship-map/layout", headers=headers)
    assert r.status_code == 200
    assert r.json()["positions"] == {}


def test_layout_save_reload(client, users_two_orgs):
    (_, org_a), _ = users_two_orgs
    headers = _login(client, "layout-a@test.com", org_a.id)
    body = {
        "positions": {
            "ICTProvider:aaa": {"x": 120.5, "y": 340.0},
            "Contract:bbb": {"x": 400, "y": 100},
        }
    }
    put = client.put("/api/v1/dora/relationship-map/layout", json=body, headers=headers)
    assert put.status_code == 200
    get = client.get("/api/v1/dora/relationship-map/layout", headers=headers)
    assert get.status_code == 200
    assert get.json()["positions"]["ICTProvider:aaa"]["x"] == 120.5


def test_layout_tenant_isolation(client, users_two_orgs):
    (_, org_a), (_, org_b) = users_two_orgs
    headers_a = _login(client, "layout-a@test.com", org_a.id)
    headers_b = _login(client, "layout-b@test.com", org_b.id)
    client.put(
        "/api/v1/dora/relationship-map/layout",
        json={"positions": {"RiskAssessment:x": {"x": 1, "y": 2}}},
        headers=headers_a,
    )
    r_b = client.get("/api/v1/dora/relationship-map/layout", headers=headers_b)
    assert r_b.status_code == 200
    assert r_b.json()["positions"] == {}


def test_layout_requires_auth(client):
    r = client.get("/api/v1/dora/relationship-map/layout")
    assert r.status_code == 401
