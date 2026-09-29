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

    asset = client.post(
        "/api/v1/ict-assets",
        headers=headers,
        json={
            "name": "Core DB",
            "asset_identifier": "ICT-1",
            "inherent_criticality": CriticalOrImportant.NEITHER.value,
        },
    )
    assert asset.status_code == 201
    asset_id = asset.json()["id"]
    assert asset.json()["inherent_criticality"] == CriticalOrImportant.NEITHER.value

    mapping = client.post(
        "/api/v1/asset-function-maps",
        headers=headers,
        json={"function_id": fn_id, "ict_asset_id": asset_id},
    )
    assert mapping.status_code == 201
    assert mapping.json()["supports_critical_function"] is True

    refreshed = client.get(f"/api/v1/ict-assets/{asset_id}", headers=headers)
    assert refreshed.json()["inherent_criticality"] == CriticalOrImportant.NEITHER.value

