"""Evidence list API — must use uploaded_at ordering."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.enums import ProviderStatus, ProviderType, VerificationStatus
from app.models.evidence import DocumentType, Evidence
from app.models.financial_entity import FinancialEntity
from app.models.provider import ICTProvider
from sqlalchemy import select


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


def test_list_evidence_returns_200(client, db_session):
    org = FinancialEntity(legal_name="Ev Bank", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="ev@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.USER)
    )
    provider = ICTProvider(
        financial_entity_id=org.id,
        legal_name="P",
        country_code="DE",
        provider_type=ProviderType.OTHER,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(provider)
    db_session.flush()
    doc_type = db_session.scalar(select(DocumentType).limit(1))
    assert doc_type is not None
    db_session.add(
        Evidence(
            financial_entity_id=org.id,
            provider_id=provider.id,
            document_type_id=doc_type.id,
            storage_provider="local",
            storage_object_key="evidence/test.pdf",
            file_name="test.pdf",
            content_hash="a" * 64,
            uploaded_by="ev@test.com",
            verification_status=VerificationStatus.UNVERIFIED,
        )
    )
    db_session.flush()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "ev@test.com", "password": "pass", "organization_id": str(org.id)},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    r = client.get("/api/v1/evidence?page=1&page_size=20", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert body["items"][0]["file_name"] == "test.pdf"
