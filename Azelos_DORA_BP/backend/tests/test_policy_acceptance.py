"""Mandatory platform policy acceptance."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.legal.policy_catalog import REQUIRED_POLICIES
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity
from app.models.policy_acceptance import UserPolicyAcceptance


@pytest.fixture
def client(db_session, monkeypatch):
    monkeypatch.setenv("POLICY_ACCEPTANCE_ENFORCED", "1")
    from app.core.config import get_settings

    get_settings.cache_clear()
    from app.core.database import get_db
    from app.main import create_app

    app = create_app()

    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    yield TestClient(app)
    app.dependency_overrides.clear()
    get_settings.cache_clear()


@pytest.fixture
def user_org(db_session):
    org = FinancialEntity(legal_name="Policy Org", country_code="FR", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(
        email="policy-user@example.com",
        hashed_password=hash_password("password12345"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.ORG_ADMIN)
    )
    db_session.flush()
    return user, org


@pytest.fixture
def auth_headers(client, user_org):
    user, org = user_org
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": user.email,
            "password": "password12345",
            "organization_id": str(org.id),
        },
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_login_then_policy_status_not_accepted(client, auth_headers):
    st = client.get("/api/v1/policies/status", headers=auth_headers)
    assert st.status_code == 200
    body = st.json()
    assert body["all_accepted"] is False
    assert len(body["missing_policy_keys"]) == len(REQUIRED_POLICIES)


def test_protected_api_blocked_until_acceptance(client, auth_headers):
    r = client.get("/api/v1/business-functions", headers=auth_headers)
    assert r.status_code == 403
    detail = r.json()["detail"]
    assert detail["code"] == "POLICY_ACCEPTANCE_REQUIRED"


def test_accept_then_access(client, auth_headers, db_session):
    acc = client.post("/api/v1/policies/accept", headers=auth_headers, json={"confirm": True})
    assert acc.status_code == 200
    assert acc.json()["all_accepted"] is True

    r = client.get("/api/v1/business-functions", headers=auth_headers)
    assert r.status_code == 200

    rows = db_session.scalars(select(UserPolicyAcceptance)).all()
    assert len(rows) >= len(REQUIRED_POLICIES)


def test_acceptance_records_not_overwritten(client, auth_headers, db_session):
    client.post("/api/v1/policies/accept", headers=auth_headers, json={"confirm": True})
    count1 = len(db_session.scalars(select(UserPolicyAcceptance)).all())
    client.post("/api/v1/policies/accept", headers=auth_headers, json={"confirm": True})
    count2 = len(db_session.scalars(select(UserPolicyAcceptance)).all())
    assert count2 == count1
