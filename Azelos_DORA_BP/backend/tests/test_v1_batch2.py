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


def test_oidc_disabled(client):
    r = client.post(
        "/api/v1/auth/oidc/token",
        json={"id_token": "fake"},
    )
    assert r.status_code == 400
    assert "OIDC" in r.text


def test_export_providers_csv(client, db_session):
    from app.core.passwords import hash_password
    from app.core.rbac import Role
    from app.models.auth import OrganizationMembership, User
    from app.models.financial_entity import FinancialEntity
    from app.models.provider import ICTProvider
    from app.models.enums import ProviderStatus, ProviderType

    org = FinancialEntity(legal_name="Export Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="exp@example.com", hashed_password=hash_password("password12345"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.USER)
    )
    db_session.add(
        ICTProvider(
            financial_entity_id=org.id,
            legal_name="Acme ICT",
            country_code="DE",
            status=ProviderStatus.ACTIVE,
            provider_type=ProviderType.ICT_THIRD_PARTY,
        )
    )
    db_session.flush()
    login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password12345", "organization_id": str(org.id)},
    )
    token = login.json()["access_token"]
    r = client.get(
        "/api/v1/export/ict-providers.csv",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert "legal_name" in r.text
    assert "Acme ICT" in r.text
