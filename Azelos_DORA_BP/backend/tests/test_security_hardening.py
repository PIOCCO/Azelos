"""Security hardening: auth, RBAC, JWT claims, GraphQL, headers, information disclosure."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.core.config import get_settings
from app.core.passwords import hash_password
from app.core.rbac import Role
from app.core.security import create_access_token
from app.models.auth import OrganizationMembership, User
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


@pytest.fixture
def org_user(db_session):
    org = FinancialEntity(legal_name="Sec Org", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="sec-harden@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id,
            financial_entity_id=org.id,
            role=Role.USER,
        )
    )
    db_session.flush()
    return user, org


def _login(client, email, org_id):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "pass", "organization_id": str(org_id)},
    )


def test_expired_jwt_rejected(client, org_user):
    user, org = org_user
    settings = get_settings()
    payload = {
        "sub": str(user.id),
        "org_id": str(org.id),
        "role": Role.USER.value,
        "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    r = client.get("/api/v1/business-functions", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_forged_role_claim_does_not_escalate(client, org_user):
    """JWT role claim is ignored; membership role is authoritative."""
    user, org = org_user
    token = create_access_token(
        str(user.id),
        {"org_id": str(org.id), "role": Role.SUPER_ADMIN.value},
    )
    r = client.post(
        "/api/v1/organizations",
        headers={"Authorization": f"Bearer {token}"},
        json={"legal_name": "Evil", "country_code": "DE"},
    )
    assert r.status_code == 403


def test_database_status_requires_auth(client):
    assert client.get("/api/v1/database/status").status_code == 401


def test_database_status_user_forbidden(client, org_user):
    user, org = org_user
    token = _login(client, user.email, org.id).json()["access_token"]
    r = client.get("/api/v1/database/status", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_database_status_org_admin_ok(client, db_session):
    org = FinancialEntity(legal_name="Admin Org", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    admin = User(email="admin-db@test.com", hashed_password=hash_password("pass"), is_active=True)
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
    token = _login(client, admin.email, org.id).json()["access_token"]
    r = client.get("/api/v1/database/status", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert "password" not in str(body).lower()
    assert "DATABASE_URL" not in str(body)


def test_security_headers_present(client):
    r = client.get("/health")
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("X-Frame-Options") == "DENY"


def test_pagination_page_size_capped(client, org_user):
    user, org = org_user
    token = _login(client, user.email, org.id).json()["access_token"]
    r = client.get(
        "/api/v1/ict-providers?page_size=9999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422


def test_graphql_search_query_length_limit(client, org_user):
    user, org = org_user
    token = _login(client, user.email, org.id).json()["access_token"]
    r = client.post(
        "/graphql",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "query": 'query { graphSearch(query: "x", limit: 5) { id label type } }',
        },
    )
    assert r.status_code == 200
    assert r.json().get("errors")


def test_health_does_not_expose_secrets(client):
    r = client.get("/health")
    assert r.status_code == 200
    text = r.text.lower()
    assert "jwt" not in text
    assert "postgresql://" not in text
