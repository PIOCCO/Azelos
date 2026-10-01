"""End-to-end customer validation: multi-tenant isolation across core surfaces."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
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


def _org_with_user(db_session, *, legal_name: str, email: str, role: Role = Role.ORG_ADMIN):
    org = FinancialEntity(legal_name=legal_name, country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email=email, hashed_password=hash_password("SecurePass123!"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=role)
    )
    provider = ICTProvider(
        financial_entity_id=org.id,
        legal_name=f"{legal_name} ICT Partner",
        country_code="DE",
        provider_type=ProviderType.ICT_THIRD_PARTY,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(provider)
    db_session.flush()
    return org, user, provider


def _token(client, email: str, org_id, password="SecurePass123!"):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "organization_id": str(org_id)},
    )
    assert r.status_code == 200
    return r.json()["access_token"]


def test_org_a_cannot_read_org_b_provider(client, db_session):
    org_a, user_a, _ = _org_with_user(db_session, legal_name="Nordic Payments AG", email="a@nordicpay.example")
    org_b, _, provider_b = _org_with_user(db_session, legal_name="Alpine Capital SA", email="b@alpine.example")
    token_a = _token(client, user_a.email, org_a.id)
    r = client.get(
        f"/api/v1/ict-providers/{provider_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert r.status_code == 404


def test_org_a_list_excludes_org_b_providers(client, db_session):
    org_a, user_a, prov_a = _org_with_user(db_session, legal_name="Org Alpha", email="alpha@bank.example")
    org_b, _, prov_b = _org_with_user(db_session, legal_name="Org Beta", email="beta@bank.example")
    token_a = _token(client, user_a.email, org_a.id)
    r = client.get("/api/v1/ict-providers", headers={"Authorization": f"Bearer {token_a}"})
    assert r.status_code == 200
    ids = {item["id"] for item in r.json()["items"]}
    assert str(prov_a.id) in ids
    assert str(prov_b.id) not in ids


def test_unauthenticated_api_rejected(client):
    r = client.get("/api/v1/ict-providers")
    assert r.status_code == 401


def test_graphql_org_graph_requires_auth(client):
    r = client.post(
        "/graphql",
        json={"query": "query { organizationGraph { nodes { id } } }"},
    )
    assert r.status_code == 200
    assert r.json().get("errors"), "organizationGraph must require authentication"


def test_health_and_ready_public(client):
    assert client.get("/health").status_code == 200
    assert client.get("/ready").status_code in (200, 503)
