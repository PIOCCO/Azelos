import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity
from app.models.provider import ICTProvider
from app.models.enums import ProviderStatus, ProviderType


@pytest.fixture
def two_orgs(db_session):
    a = FinancialEntity(legal_name="Org A", country_code="DE", status="active")
    b = FinancialEntity(legal_name="Org B", country_code="FR", status="active")
    db_session.add_all([a, b])
    db_session.flush()
    return a, b


@pytest.fixture
def user_org_a(db_session, two_orgs):
    org_a, _ = two_orgs
    user = User(email="tenant-a@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id, financial_entity_id=org_a.id, role=Role.USER
        )
    )
    db_session.flush()
    return user, org_a


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


def test_cross_tenant_profile_denied(client, user_org_a, two_orgs):
    _, org_a = user_org_a
    _, org_b = two_orgs
    headers = _login(client, "tenant-a@test.com", org_a.id)
    r = client.get(f"/api/v1/organizations/{org_b.id}/profile", headers=headers)
    assert r.status_code == 403


def test_cross_tenant_contract_idor(client, user_org_a, two_orgs, db_session):
    _, org_a = user_org_a
    _, org_b = two_orgs
    provider_b = ICTProvider(
        financial_entity_id=org_b.id,
        legal_name="P B",
        country_code="FR",
        provider_type=ProviderType.ICT_THIRD_PARTY,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(provider_b)
    db_session.flush()
    headers = _login(client, "tenant-a@test.com", org_a.id)
    r = client.post(
        "/api/v1/contracts",
        headers=headers,
        json={
            "provider_id": str(provider_b.id),
            "reference_number": "X-1",
            "start_date": "2024-01-01",
        },
    )
    assert r.status_code == 404
