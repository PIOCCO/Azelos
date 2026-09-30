"""GraphQL entity graph: auth, tenant isolation, depth limits."""

import pytest
from fastapi.testclient import TestClient

from app.core.rbac import Role
from app.core.passwords import hash_password
from app.models.auth import OrganizationMembership, User
from app.models.business_function import BusinessFunction
from app.models.enums import BusinessFunctionStatus, CriticalOrImportant
from app.models.financial_entity import FinancialEntity
from app.models.ict_assets import ICTAsset, AssetFunctionMap
from app.models.enums import CriticalOrImportant as CI


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
def graph_setup(db_session):
    org_a = FinancialEntity(legal_name="Graph A", country_code="DE", status="active")
    org_b = FinancialEntity(legal_name="Graph B", country_code="FR", status="active")
    db_session.add_all([org_a, org_b])
    db_session.flush()
    user = User(email="graph@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org_a.id, role=Role.ORG_ADMIN)
    )
    bf_a = BusinessFunction(
        financial_entity_id=org_a.id,
        name="Payments",
        function_identifier="PAY",
        critical_or_important=CriticalOrImportant.CRITICAL,
        status=BusinessFunctionStatus.ACTIVE,
    )
    bf_b = BusinessFunction(
        financial_entity_id=org_b.id,
        name="Hidden",
        function_identifier="HID",
        critical_or_important=CriticalOrImportant.NEITHER,
        status=BusinessFunctionStatus.ACTIVE,
    )
    asset_a = ICTAsset(
        financial_entity_id=org_a.id,
        name="DB",
        asset_identifier="db-1",
        inherent_criticality=CI.IMPORTANT,
    )
    db_session.add_all([bf_a, bf_b, asset_a])
    db_session.flush()
    db_session.add(AssetFunctionMap(function_id=bf_a.id, ict_asset_id=asset_a.id, supports_critical_function=True))
    db_session.flush()
    return user, org_a, org_b, bf_a, bf_b, asset_a


ENTITY_GRAPH_QUERY = """
query($entityType: EntityTypeGQL!, $entityId: ID!, $depth: Int!) {
  entityGraph(entityType: $entityType, entityId: $entityId, depth: $depth) {
    nodes { id type label metadata }
    edges { id source target relationship metadata }
  }
}
"""


def test_graphql_requires_auth(client):
    r = client.post("/graphql", json={"query": ENTITY_GRAPH_QUERY, "variables": {
        "entityType": "BUSINESS_FUNCTION",
        "entityId": "00000000-0000-0000-0000-000000000001",
        "depth": 1,
    }})
    assert r.status_code == 200
    assert "errors" in r.json()


def test_graphql_cross_tenant_not_found(client, graph_setup):
    user, org_a, _org_b, _bf_a, bf_b, _ = graph_setup
    token = _login(client, user.email, "pass", org_a.id).json()["access_token"]
    r = client.post(
        "/graphql",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "query": ENTITY_GRAPH_QUERY,
            "variables": {
                "entityType": "BUSINESS_FUNCTION",
                "entityId": str(bf_b.id),
                "depth": 2,
            },
        },
    )
    body = r.json()
    assert body.get("errors")


def test_graphql_expands_supports_edge(client, graph_setup):
    user, org_a, _, bf_a, _, asset_a = graph_setup
    token = _login(client, user.email, "pass", org_a.id).json()["access_token"]
    r = client.post(
        "/graphql",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "query": ENTITY_GRAPH_QUERY,
            "variables": {
                "entityType": "BUSINESS_FUNCTION",
                "entityId": str(bf_a.id),
                "depth": 1,
            },
        },
    )
    data = r.json()["data"]["entityGraph"]
    types = {n["type"] for n in data["nodes"]}
    assert "ICTAsset" in types
    assert any(e["relationship"] == "SUPPORTS" for e in data["edges"])
    asset_ids = [n["id"] for n in data["nodes"] if n["type"] == "ICTAsset"]
    assert any(str(asset_a.id) in i for i in asset_ids)


def test_graphql_depth_limit(client, graph_setup):
    user, org_a, _, bf_a, _, _ = graph_setup
    token = _login(client, user.email, "pass", org_a.id).json()["access_token"]
    r = client.post(
        "/graphql",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "query": ENTITY_GRAPH_QUERY,
            "variables": {
                "entityType": "BUSINESS_FUNCTION",
                "entityId": str(bf_a.id),
                "depth": 50,
            },
        },
    )
    assert r.json().get("errors")
