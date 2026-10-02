"""Tenant integration configuration: RBAC, isolation, no secret leakage."""

import os
from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def _integration_crypto_key(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", os.environ.get("JWT_SECRET_KEY", "") + "0" * 32)
    if len(os.environ["JWT_SECRET_KEY"]) < 32:
        monkeypatch.setenv("JWT_SECRET_KEY", "test-integration-secrets-key-32chars!!")
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
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


def _org_admin(client, db_session, label: str):
    org = FinancialEntity(legal_name=f"{label} Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(
        email=f"{label.lower()}@example.com",
        hashed_password=hash_password("password12345"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id, financial_entity_id=org.id, role=Role.ORG_ADMIN
        )
    )
    db_session.flush()
    login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password12345", "organization_id": str(org.id)},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    return org, token


def test_integrations_require_org_admin(client, db_session):
    org = FinancialEntity(legal_name="User Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="user@example.com", hashed_password=hash_password("password12345"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.USER)
    )
    db_session.flush()
    login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password12345", "organization_id": str(org.id)},
    )
    token = login.json()["access_token"]
    r = client.get("/api/v1/integrations", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_postgresql_integration_no_password_in_response(client, db_session):
    _org, token = _org_admin(client, db_session, "Alpha")
    headers = {"Authorization": f"Bearer {token}"}
    with patch("app.services.tenant_integration_service.psycopg.connect") as mock_connect:
        mock_conn = MagicMock()
        mock_connect.return_value.__enter__.return_value = mock_conn
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        create = client.post(
            "/api/v1/integrations/postgresql",
            headers=headers,
            json={
                "name": "PostgreSQL",
                "host": "db.customer.internal",
                "port": 5432,
                "database": "extensions",
                "username": "dora_reader",
                "password": "super-secret",
                "ssl_mode": "require",
            },
        )
        assert create.status_code == 201
        body = create.json()
        assert "super-secret" not in str(body)
        assert "password" not in body.get("config", {})
        integration_id = body["id"]

        test = client.post(f"/api/v1/integrations/{integration_id}/test", headers=headers)
        assert test.status_code == 200
        assert test.json()["success"] is True
        assert "super-secret" not in test.text


def test_cross_tenant_integration_access_denied(client, db_session):
    _org_a, token_a = _org_admin(client, db_session, "TenantA")
    _org_b, token_b = _org_admin(client, db_session, "TenantB")
    create = client.post(
        "/api/v1/integrations/postgresql",
        headers={"Authorization": f"Bearer {token_b}"},
        json={
            "name": "PostgreSQL",
            "host": "b.db",
            "port": 5432,
            "database": "b",
            "username": "u",
            "password": "pass-word-long-enough",
            "ssl_mode": "prefer",
        },
    )
    assert create.status_code == 201
    int_id = create.json()["id"]

    r = client.post(
        f"/api/v1/integrations/{int_id}/test",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert r.status_code == 404
