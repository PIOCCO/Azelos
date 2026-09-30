"""P0 V1 SaaS: requirements PATCH, tenant provision, rate limit, upload policy."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.dora_baseline import OrganizationRequirement
from app.models.financial_entity import FinancialEntity


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


def test_patch_organization_requirement(client, db_session):
    org = FinancialEntity(legal_name="Req Org", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="admin@example.com", hashed_password=hash_password("password12345"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.ORG_ADMIN)
    )
    from app.services.tenant_provisioning import TenantProvisioningService

    TenantProvisioningService(db_session)._seed_org_requirements(org.id)
    db_session.flush()
    org_req = db_session.query(OrganizationRequirement).filter_by(financial_entity_id=org.id).first()
    assert org_req is not None, "Seed dora requirements via migrations/reference data"
    r = _login(client, user.email, "password12345", org.id)
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    r = client.patch(
        f"/api/v1/organizations/{org.id}/requirements/{org_req.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"implementation_status": "in_progress", "owner": "risk@req.test"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["implementation_status"] == "in_progress"


def test_upload_blocks_exe(client, db_session):
    from app.models.evidence import DocumentType

    org = FinancialEntity(legal_name="Up Org", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="sec@example.com", hashed_password=hash_password("password12345"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id, financial_entity_id=org.id, role=Role.SECURITY_MANAGER
        )
    )
    doc = DocumentType(code="POL", label="Policy")
    db_session.add(doc)
    db_session.flush()
    r = _login(client, user.email, "password12345", org.id)
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    r = client.post(
        "/api/v1/evidence/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("malware.exe", b"fake", "application/octet-stream")},
        data={"document_type_id": str(doc.id)},
    )
    assert r.status_code == 400


def test_rate_limit_login(client, monkeypatch):
    monkeypatch.delenv("DISABLE_RATE_LIMIT", raising=False)
    for _ in range(125):
        r = client.post(
            "/api/v1/auth/login",
            json={
                "email": "none@test.com",
                "password": "wrong",
                "organization_id": "00000000-0000-0000-0000-000000000001",
            },
        )
        if r.status_code == 429:
            break
    else:
        pytest.fail("Expected rate limit 429 on repeated login attempts")
