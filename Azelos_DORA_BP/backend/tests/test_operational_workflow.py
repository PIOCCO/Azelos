"""End-to-end operational chain on PostgreSQL."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.enums import CriticalOrImportant, RiskDimensionLevel
from app.models.enums_operational import IncidentSeverity, ResilienceTestKind
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


def test_asset_to_incident_to_test_workflow(client, db_session):
    org = FinancialEntity(legal_name="Chain Bank", country_code="FR", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="chain@test.com", hashed_password=hash_password("pass"), is_active=True)
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
        json={"email": "chain@test.com", "password": "pass", "organization_id": str(org.id)},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    bf = client.post(
        "/api/v1/business-functions",
        headers=headers,
        json={
            "name": "Treasury",
            "function_identifier": "TRS-1",
            "critical_or_important": CriticalOrImportant.CRITICAL.value,
        },
    )
    assert bf.status_code == 201
    bf_id = bf.json()["id"]

    asset = client.post(
        "/api/v1/ict-assets",
        headers=headers,
        json={
            "name": "Core DB",
            "asset_identifier": "DB-1",
            "inherent_criticality": CriticalOrImportant.CRITICAL.value,
        },
    )
    assert asset.status_code == 201
    asset_id = asset.json()["id"]

    provider = client.post(
        "/api/v1/ict-providers",
        headers=headers,
        json={
            "legal_name": "CloudCo",
            "lei": "529900T8BM49AURSDO55",
            "country_code": "IE",
        },
    )
    assert provider.status_code == 201
    provider_id = provider.json()["id"]

    risk = client.post(
        "/api/v1/risks",
        headers=headers,
        json={
            "provider_id": provider_id,
            "criticality": RiskDimensionLevel.HIGH.value,
            "data_sensitivity": RiskDimensionLevel.MEDIUM.value,
            "substitutability": RiskDimensionLevel.LOW.value,
            "concentration_risk": RiskDimensionLevel.HIGH.value,
            "geographic_risk": RiskDimensionLevel.MEDIUM.value,
            "security_assurance": RiskDimensionLevel.MEDIUM.value,
            "contract_gaps": RiskDimensionLevel.LOW.value,
            "exit_feasibility": RiskDimensionLevel.MEDIUM.value,
            "assessor": "chain@test.com",
            "likelihood": RiskDimensionLevel.HIGH.value,
            "impact": RiskDimensionLevel.HIGH.value,
        },
    )
    assert risk.status_code == 201
    risk_id = risk.json()["id"]
    assert risk.json()["inherent_risk_level"] in ("high", "critical")

    incident = client.post(
        "/api/v1/incidents",
        headers=headers,
        json={
            "title": "DB latency",
            "severity": IncidentSeverity.MEDIUM.value,
            "links": [
                {"link_kind": "ict_asset", "linked_entity_id": asset_id},
                {"link_kind": "business_function", "linked_entity_id": bf_id},
                {"link_kind": "ict_provider", "linked_entity_id": provider_id},
                {"link_kind": "risk_assessment", "linked_entity_id": risk_id},
            ],
        },
    )
    assert incident.status_code == 201

    test = client.post(
        "/api/v1/resilience-tests",
        headers=headers,
        json={
            "title": "DR scenario Q1",
            "test_kind": ResilienceTestKind.DISASTER_RECOVERY.value,
            "ict_asset_id": asset_id,
        },
    )
    assert test.status_code == 201

    overview = client.get("/api/v1/dora/overview", headers=headers)
    assert overview.status_code == 200
    body = overview.json()
    assert body["incidents_total"] >= 1
    assert body["incidents_module_available"] is True
