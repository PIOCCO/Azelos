"""End-to-end API flow on PostgreSQL (scoped to one organization)."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.enums import CriticalOrImportant
from app.models.enums_profile import OrganizationType
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


def test_organization_dora_flow(client, db_session):
    org = FinancialEntity(legal_name="Flow Bank", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    admin = User(
        email="flow@test.com",
        hashed_password=hash_password("pass"),
        is_active=True,
    )
    db_session.add(admin)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=admin.id,
            financial_entity_id=org.id,
            role=Role.ORG_ADMIN,
        )
    )
    db_session.flush()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "flow@test.com", "password": "pass", "organization_id": str(org.id)},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    profile = client.patch(
        f"/api/v1/organizations/{org.id}/profile",
        headers=headers,
        json={
            "organization_type": OrganizationType.PAYMENT_INSTITUTION.value,
            "art16_eligible": True,
        },
    )
    assert profile.status_code == 200

    appl = client.get(f"/api/v1/organizations/{org.id}/applicability", headers=headers)
    assert appl.status_code == 200
    body = appl.json()
    assert body["organization_id"] == str(org.id)
    assert "payment_art16_simplified_rmf" in body["rules"]

    bf = client.post(
        "/api/v1/business-functions",
        headers=headers,
        json={
            "name": "Payments",
            "function_identifier": "PAY-1",
            "critical_or_important": CriticalOrImportant.CRITICAL.value,
        },
    )
    assert bf.status_code == 201
    fn_id = bf.json()["id"]

    info = client.post(
        "/api/v1/information-assets",
        headers=headers,
        json={"name": "Payment Data", "asset_identifier": "INFO-1"},
    )
    assert info.status_code == 201
    info_id = info.json()["id"]

    asset = client.post(
        "/api/v1/ict-assets",
        headers=headers,
        json={
            "name": "Core DB",
            "asset_identifier": "ICT-1",
            "inherent_criticality": CriticalOrImportant.NEITHER.value,
            "information_asset_id": info_id,
        },
    )
    assert asset.status_code == 201
    asset_id = asset.json()["id"]
    assert asset.json()["inherent_criticality"] == CriticalOrImportant.NEITHER.value
    assert asset.json()["information_asset_id"] == info_id

    mapping = client.post(
        "/api/v1/asset-function-maps",
        headers=headers,
        json={"function_id": fn_id, "ict_asset_id": asset_id},
    )
    assert mapping.status_code == 201
    assert mapping.json()["supports_critical_function"] is True

    refreshed = client.get(f"/api/v1/ict-assets/{asset_id}", headers=headers)
    assert refreshed.json()["inherent_criticality"] == CriticalOrImportant.NEITHER.value

    provider = client.post(
        "/api/v1/ict-providers",
        headers=headers,
        json={"legal_name": "CloudCo", "country_code": "DE"},
    )
    assert provider.status_code == 201
    provider_id = provider.json()["id"]

    contract = client.post(
        "/api/v1/contracts",
        headers=headers,
        json={
            "provider_id": provider_id,
            "reference_number": "CTR-1",
            "start_date": "2024-01-01",
        },
    )
    assert contract.status_code == 201
    contract_id = contract.json()["id"]

    service = client.post(
        "/api/v1/ict-services",
        headers=headers,
        json={"contract_id": contract_id, "name": "Hosted DB"},
    )
    assert service.status_code == 201
    service_id = service.json()["id"]

    risk = client.post(
        "/api/v1/risks",
        headers=headers,
        json={
            "provider_id": provider_id,
            "contract_id": contract_id,
            "service_id": service_id,
            "criticality": "medium",
            "data_sensitivity": "medium",
            "substitutability": "medium",
            "concentration_risk": "low",
            "geographic_risk": "low",
            "security_assurance": "medium",
            "contract_gaps": "low",
            "exit_feasibility": "medium",
            "assessor": "flow@test.com",
        },
    )
    assert risk.status_code == 201
    assert risk.json()["resulting_risk_level"]

    baseline = client.get("/api/v1/regulatory-requirements", headers=headers)
    assert baseline.status_code == 200

    controls = client.get("/api/v1/controls/definitions", headers=headers)
    assert controls.status_code == 200

    biz_svc = client.post(
        "/api/v1/business-services",
        headers=headers,
        json={
            "name": "Payment Platform",
            "rto_minutes": 60,
            "rpo_minutes": 15,
        },
    )
    assert biz_svc.status_code == 201
    biz_svc_id = biz_svc.json()["id"]

    recovery = client.post(
        "/api/v1/resilience/recovery-tests",
        headers=headers,
        json={
            "business_service_id": biz_svc_id,
            "scenario": "DB failover",
            "target_rto_minutes": 60,
            "target_rpo_minutes": 15,
            "actual_recovery_minutes": 45,
            "actual_data_loss_minutes": 5,
        },
    )
    assert recovery.status_code == 201

    finding = client.post(
        "/api/v1/resilience/findings",
        headers=headers,
        json={
            "title": "RTO gap on failover",
            "severity": "medium",
            "business_service_id": biz_svc_id,
        },
    )
    assert finding.status_code == 201
    finding_id = finding.json()["id"]

    remediation = client.post(
        "/api/v1/resilience/remediation",
        headers=headers,
        json={
            "finding_id": finding_id,
            "title": "Improve runbook",
        },
    )
    assert remediation.status_code == 201

    evidence = client.post(
        "/api/v1/resilience/evidence",
        headers=headers,
        json={
            "title": "Test execution log",
            "source_kind": "recovery_test",  # EvidenceSourceKind.RECOVERY_TEST
        },
    )
    assert evidence.status_code == 201

