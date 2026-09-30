"""
Diagram-aligned end-to-end workflows (Azelos DORA Supplier Risk Blueprint).

Maps architecture diagram modules to verifiable API + DB + graph flows.
"""

from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.enums import CriticalOrImportant, RiskDimensionLevel
from app.models.enums_operational import IncidentSeverity, ResilienceTestKind
from app.models.financial_entity import FinancialEntity

ENTITY_GRAPH = """
query($entityType: EntityTypeGQL!, $entityId: ID!, $depth: Int!) {
  entityGraph(entityType: $entityType, entityId: $entityId, depth: $depth) {
    nodes { id type label }
    edges { relationship source target }
  }
}
"""


@pytest.fixture
def client(db_session):
    from app.core.database import get_db
    from app.main import create_app

    app = create_app()
    app.dependency_overrides[get_db] = _override(db_session)
    yield TestClient(app)
    app.dependency_overrides.clear()


def _override(db_session):
    def _gen():
        yield db_session

    return _gen


@pytest.fixture
def org_admin(client, db_session):
    org = FinancialEntity(legal_name="Diagram Org", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="diagram@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.ORG_ADMIN)
    )
    db_session.flush()
    login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "pass", "organization_id": str(org.id)},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    return org, headers


def test_scenario_b_supplier_chain_audit_and_overview(client, org_admin, db_session):
    """Supplier → Contract → Service → Asset → Risk → Incident (diagram supplier module)."""
    org, headers = org_admin
    prov = client.post(
        "/api/v1/ict-providers",
        headers=headers,
        json={"legal_name": "Diag Prov", "lei": "529900T8BM49AURSDO55", "country_code": "DE"},
    )
    assert prov.status_code == 201
    pid = prov.json()["id"]

    audit = client.get("/api/v1/audit-records?page=1", headers=headers)
    assert audit.status_code == 200
    assert any(r["entity_type"] == "ICTProvider" for r in audit.json()["items"])

    contract = client.post(
        "/api/v1/contracts",
        headers=headers,
        json={
            "provider_id": pid,
            "reference_number": "D-1",
            "contract_type": "outsourcing",
            "start_date": str(date.today()),
        },
    )
    assert contract.status_code == 201
    cid = contract.json()["id"]

    service = client.post(
        "/api/v1/ict-services",
        headers=headers,
        json={"contract_id": cid, "name": "Hosted DB", "supports_critical_or_important": "critical"},
    )
    assert service.status_code == 201
    sid = service.json()["id"]

    asset = client.post(
        "/api/v1/ict-assets",
        headers=headers,
        json={
            "name": "DB Node",
            "asset_identifier": "D-DB",
            "inherent_criticality": "critical",
        },
    )
    assert asset.status_code == 201
    aid = asset.json()["id"]

    risk = client.post(
        "/api/v1/risks",
        headers=headers,
        json={
            "provider_id": pid,
            "criticality": RiskDimensionLevel.HIGH.value,
            "data_sensitivity": RiskDimensionLevel.MEDIUM.value,
            "substitutability": RiskDimensionLevel.LOW.value,
            "concentration_risk": RiskDimensionLevel.HIGH.value,
            "geographic_risk": RiskDimensionLevel.MEDIUM.value,
            "security_assurance": RiskDimensionLevel.MEDIUM.value,
            "contract_gaps": RiskDimensionLevel.LOW.value,
            "exit_feasibility": RiskDimensionLevel.MEDIUM.value,
            "assessor": "diagram@test.com",
        },
    )
    assert risk.status_code == 201
    rid = risk.json()["id"]

    inc = client.post(
        "/api/v1/incidents",
        headers=headers,
        json={
            "title": "Supplier outage",
            "severity": IncidentSeverity.HIGH.value,
            "links": [
                {"link_kind": "ict_provider", "linked_entity_id": pid},
                {"link_kind": "ict_service", "linked_entity_id": sid},
                {"link_kind": "ict_asset", "linked_entity_id": aid},
                {"link_kind": "risk_assessment", "linked_entity_id": rid},
            ],
        },
    )
    assert inc.status_code == 201

    overview = client.get("/api/v1/dora/overview", headers=headers)
    assert overview.json()["incidents_total"] >= 1
    assert overview.json()["ict_providers_total"] >= 1


def test_scenario_e_graph_reflects_supplier_chain(client, org_admin, db_session):
    """Relationship map uses DB FK paths (BF→asset→service→contract→provider)."""
    org, headers = org_admin
    # Reuse minimal chain via operational workflow pattern
    bf = client.post(
        "/api/v1/business-functions",
        headers=headers,
        json={
            "name": "Pay",
            "function_identifier": "DG-PAY",
            "critical_or_important": CriticalOrImportant.CRITICAL.value,
        },
    )
    bf_id = bf.json()["id"]
    prov = client.post(
        "/api/v1/ict-providers",
        headers=headers,
        json={"legal_name": "G Prov", "lei": "98450064AFAAGAE6F141", "country_code": "IE"},
    )
    pid = prov.json()["id"]
    contract = client.post(
        "/api/v1/contracts",
        headers=headers,
        json={
            "provider_id": pid,
            "reference_number": "G-C",
            "contract_type": "outsourcing",
            "start_date": str(date.today()),
        },
    )
    cid = contract.json()["id"]
    service = client.post(
        "/api/v1/ict-services",
        headers=headers,
        json={"contract_id": cid, "name": "G Svc", "supports_critical_or_important": "important"},
    )
    sid = service.json()["id"]
    asset = client.post(
        "/api/v1/ict-assets",
        headers=headers,
        json={"name": "G Asset", "asset_identifier": "G-A", "inherent_criticality": "important"},
    )
    aid = asset.json()["id"]
    client.post(
        "/api/v1/asset-function-maps",
        headers=headers,
        json={"function_id": bf_id, "ict_asset_id": aid, "supports_critical_function": True},
    )
    from uuid import UUID

    from app.models.business_function import FunctionServiceMapping

    db_session.add(
        FunctionServiceMapping(function_id=UUID(bf_id), service_id=UUID(sid))
    )
    db_session.flush()
    r = client.post(
        "/graphql",
        headers=headers,
        json={
            "query": ENTITY_GRAPH,
            "variables": {"entityType": "ICT_PROVIDER", "entityId": pid, "depth": 2},
        },
    )
    assert r.status_code == 200
    data = r.json()["data"]["entityGraph"]
    types = {n["type"] for n in data["nodes"]}
    assert "ICTProvider" in types
    assert "Contract" in types
    assert "ICTService" in types


def test_incident_rejects_cross_tenant_link(client, org_admin, db_session):
    org, headers = org_admin
    other = FinancialEntity(legal_name="Other", country_code="FR", status="active")
    db_session.add(other)
    db_session.flush()
    from app.models.ict_assets import ICTAsset

    foreign = ICTAsset(
        financial_entity_id=other.id,
        name="Foreign",
        asset_identifier="F-1",
        inherent_criticality=CriticalOrImportant.NEITHER,
    )
    db_session.add(foreign)
    db_session.flush()

    bad = client.post(
        "/api/v1/incidents",
        headers=headers,
        json={
            "title": "Bad link",
            "severity": IncidentSeverity.LOW.value,
            "links": [{"link_kind": "ict_asset", "linked_entity_id": str(foreign.id)}],
        },
    )
    assert bad.status_code == 404


def test_scenario_d_resilience_test_persisted(client, org_admin):
    org, headers = org_admin
    t = client.post(
        "/api/v1/resilience-tests",
        headers=headers,
        json={"title": "DR Run", "test_kind": ResilienceTestKind.DISASTER_RECOVERY.value},
    )
    assert t.status_code == 201
    listed = client.get("/api/v1/resilience-tests", headers=headers)
    assert listed.json()["total"] >= 1
