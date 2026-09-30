"""GraphQL relationship map E2E against real PostgreSQL data."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.business_function import BusinessFunction, FunctionServiceMapping
from app.models.enums import BusinessFunctionStatus, CriticalOrImportant, ServiceStatus
from app.models.financial_entity import FinancialEntity
from app.models.ict_assets import AssetFunctionMap, ICTAsset
from app.models.contract import Contract
from app.models.provider import ICTProvider
from app.models.service import ICTService
from app.models.enums import ContractStatus, ContractType, ProviderStatus, ProviderType
from datetime import date


ENTITY_GRAPH = """
query($entityType: EntityTypeGQL!, $entityId: ID!, $depth: Int!) {
  entityGraph(entityType: $entityType, entityId: $entityId, depth: $depth) {
    nodes { id type label metadata }
    edges { id source target relationship }
  }
}
"""


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


@pytest.fixture
def chain(db_session):
    org = FinancialEntity(legal_name="Graph Chain", country_code="DE", status="active")
    org_b = FinancialEntity(legal_name="Other", country_code="FR", status="active")
    db_session.add_all([org, org_b])
    db_session.flush()
    user = User(email="graph-chain@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.ORG_ADMIN)
    )
    bf = BusinessFunction(
        financial_entity_id=org.id,
        name="Payments",
        function_identifier="PAY-G",
        critical_or_important=CriticalOrImportant.CRITICAL,
        status=BusinessFunctionStatus.ACTIVE,
    )
    asset = ICTAsset(
        financial_entity_id=org.id,
        name="Core DB",
        asset_identifier="G-ICT",
        inherent_criticality=CriticalOrImportant.NEITHER,
    )
    provider = ICTProvider(
        financial_entity_id=org.id,
        legal_name="Prov",
        country_code="DE",
        provider_type=ProviderType.ICT_THIRD_PARTY,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add_all([bf, asset, provider])
    db_session.flush()
    contract = Contract(
        financial_entity_id=org.id,
        provider_id=provider.id,
        reference_number="G-CTR",
        contract_type=ContractType.OUTSOURCING,
        status=ContractStatus.ACTIVE,
        start_date=date(2024, 1, 1),
    )
    db_session.add(contract)
    db_session.flush()
    service = ICTService(
        financial_entity_id=org.id,
        contract_id=contract.id,
        name="DB Service",
        status=ServiceStatus.ACTIVE,
        supports_critical_or_important=CriticalOrImportant.IMPORTANT,
    )
    db_session.add(service)
    db_session.flush()
    db_session.add(
        AssetFunctionMap(function_id=bf.id, ict_asset_id=asset.id, supports_critical_function=True)
    )
    db_session.add(FunctionServiceMapping(function_id=bf.id, service_id=service.id))
    db_session.flush()
    return user, org, bf, asset, service, provider, contract


def test_graph_chain_from_business_function(client, chain):
    user, _org, bf, asset, service, provider, contract = chain
    login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "pass", "organization_id": str(_org.id)},
    )
    token = login.json()["access_token"]
    r = client.post(
        "/graphql",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "query": ENTITY_GRAPH,
            "variables": {
                "entityType": "BUSINESS_FUNCTION",
                "entityId": str(bf.id),
                "depth": 3,
            },
        },
    )
    data = r.json()["data"]["entityGraph"]
    types = {n["type"] for n in data["nodes"]}
    assert "BusinessFunction" in types
    assert "ICTAsset" in types
    assert "ICTService" in types
    assert "ICTProvider" in types
    assert "Contract" in types
    rels = {e["relationship"] for e in data["edges"]}
    assert "SUPPORTS" in rels
    assert "UNDER_CONTRACT" in rels or "PROVIDED_BY" in rels
    asset_node = next(n for n in data["nodes"] if n["type"] == "ICTAsset")
    assert asset_node["metadata"].get("inherent_criticality") == CriticalOrImportant.NEITHER.value

    search = client.post(
        "/graphql",
        headers={"Authorization": f"Bearer {token}"},
        json={"query": 'query { graphSearch(query: "Core", limit: 5) { id type label } }'},
    )
    hits = search.json()["data"]["graphSearch"]
    assert any("Core" in h["label"] for h in hits)
