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


def _seed_org_user(db_session, *, role):
    from app.core.passwords import hash_password
    from app.core.rbac import Role
    from app.models.auth import OrganizationMembership, User
    from app.models.financial_entity import FinancialEntity
    from app.models.enums import ProviderStatus, ProviderType
    from app.models.provider import ICTProvider

    org = FinancialEntity(legal_name="Import Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(
        email="import@example.com",
        hashed_password=hash_password("password12345"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=role)
    )
    db_session.add(
        ICTProvider(
            financial_entity_id=org.id,
            legal_name="FindMe Provider",
            country_code="DE",
            status=ProviderStatus.ACTIVE,
            provider_type=ProviderType.ICT_THIRD_PARTY,
        )
    )
    db_session.flush()
    return org, user


def test_login_options_public(client):
    r = client.get("/api/v1/auth/login-options")
    assert r.status_code == 200
    body = r.json()
    assert "oidc_enabled" in body


def test_provider_search_q(client, db_session):
    from app.core.rbac import Role

    org, user = _seed_org_user(db_session, role=Role.USER)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password12345", "organization_id": str(org.id)},
    )
    token = login.json()["access_token"]
    r = client.get(
        "/api/v1/ict-providers?q=FindMe",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["total"] == 1


def test_provider_csv_import(client, db_session):
    from app.core.rbac import Role

    org, user = _seed_org_user(db_session, role=Role.SECURITY_MANAGER)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password12345", "organization_id": str(org.id)},
    )
    token = login.json()["access_token"]
    csv_body = "legal_name,country_code\nNew ICT GmbH,FR\n"
    r = client.post(
        "/api/v1/import/ict-providers.csv",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("providers.csv", io.BytesIO(csv_body.encode()), "text/csv")},
    )
    assert r.status_code == 200
    assert r.json()["created"] == 1
