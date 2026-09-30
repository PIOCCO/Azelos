"""ICT incident lifecycle API."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.enums_operational import IncidentSeverity, IncidentStatus
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


def test_incident_lifecycle(client, db_session):
    org = FinancialEntity(legal_name="Incident Bank", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="inc@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id,
            financial_entity_id=org.id,
            role=Role.SECURITY_MANAGER,
        )
    )
    db_session.flush()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "inc@test.com", "password": "pass", "organization_id": str(org.id)},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    created = client.post(
        "/api/v1/incidents",
        headers=headers,
        json={
            "title": "Payment outage",
            "severity": IncidentSeverity.HIGH.value,
            "description": "Core switch failure",
        },
    )
    assert created.status_code == 201
    inc_id = created.json()["id"]
    assert created.json()["status"] == IncidentStatus.DETECTED.value
    assert created.json()["is_major"] is True

    patched = client.patch(
        f"/api/v1/incidents/{inc_id}",
        headers=headers,
        json={"status": IncidentStatus.INVESTIGATING.value},
    )
    assert patched.status_code == 200
    assert len(patched.json()["timeline"]) >= 2

    listed = client.get("/api/v1/incidents", headers=headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
