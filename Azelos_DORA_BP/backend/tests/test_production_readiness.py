"""Production-readiness checks for customer-facing workflows."""

import io

import pytest
from fastapi.testclient import TestClient


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


def _login(client, user, org, password="password12345"):
    r = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": password, "organization_id": str(org.id)},
    )
    assert r.status_code == 200
    return r.json()["access_token"]


def test_document_types_list_for_evidence_upload(client, db_session):
    from app.core.passwords import hash_password
    from app.core.rbac import Role
    from app.models.auth import OrganizationMembership, User
    from app.models.evidence import DocumentType
    from app.models.financial_entity import FinancialEntity

    org = FinancialEntity(legal_name="Doc Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="doc@example.com", hashed_password=hash_password("password12345"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.USER)
    )
    db_session.add(DocumentType(code="POL", label="Policy document"))
    db_session.flush()
    token = _login(client, user, org)
    r = client.get(
        "/api/v1/evidence/document-types",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert len(body) >= 1
    assert body[0]["code"]


def test_incidents_list_not_stub(client, db_session):
    from app.core.passwords import hash_password
    from app.core.rbac import Role
    from app.models.auth import OrganizationMembership, User
    from app.models.financial_entity import FinancialEntity

    org = FinancialEntity(legal_name="Inc Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="inc2@example.com", hashed_password=hash_password("password12345"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.USER)
    )
    db_session.flush()
    token = _login(client, user, org)
    r = client.get(
        "/api/v1/incidents?page=1&page_size=1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert "total" in r.json()


def test_bcp_create_persists(client, db_session):
    from app.core.passwords import hash_password
    from app.core.rbac import Role
    from app.models.auth import OrganizationMembership, User
    from app.models.financial_entity import FinancialEntity

    org = FinancialEntity(legal_name="BCP Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(
        email="bcp@example.com",
        hashed_password=hash_password("password12345"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id,
            financial_entity_id=org.id,
            role=Role.BUSINESS_CONTINUITY_MANAGER,
        )
    )
    db_session.flush()
    token = _login(client, user, org)
    create = client.post(
        "/api/v1/business-continuity",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Primary BCP"},
    )
    assert create.status_code == 201
    listed = client.get(
        "/api/v1/business-continuity",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert listed.status_code == 200
    assert listed.json()["total"] >= 1
