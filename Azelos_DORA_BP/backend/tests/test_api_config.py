"""Configuration API tests (FastAPI TestClient)."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.api.deps import get_db
from app.api.main import app
from app.models.financial_entity import FinancialEntity
from app.models.platform_config import PlatformModule


def _get_module(db_session, key: str) -> PlatformModule:
    mod = db_session.scalar(select(PlatformModule).where(PlatformModule.key == key))
    assert mod is not None, f"seed module {key} missing — run migrations"
    return mod


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _headers(org_id: uuid.UUID, role: str = "admin"):
    return {
        "X-Organization-Id": str(org_id),
        "X-User-Id": "test-admin",
        "X-User-Role": role,
    }


def test_unauthorized_config_create(client, db_session):
    fe = FinancialEntity(legal_name="API Org", country_code="DE")
    db_session.add(fe)
    db_session.flush()
    _get_module(db_session, "THIRD_PARTY_RISK")

    resp = client.post(
        f"/api/organizations/{fe.id}/custom-fields",
        headers=_headers(fe.id, role="user"),
        json={
            "entity_type": "ict_provider",
            "field_key": "extra",
            "display_name": "Extra",
            "field_type": "TEXT",
        },
    )
    assert resp.status_code == 403


def test_cross_tenant_denied(client, db_session):
    fe1 = FinancialEntity(legal_name="A", country_code="DE")
    fe2 = FinancialEntity(legal_name="B", country_code="FR")
    db_session.add_all([fe1, fe2])
    db_session.flush()
    resp = client.get(
        f"/api/organizations/{fe2.id}/modules",
        headers=_headers(fe1.id, role="admin"),
    )
    assert resp.status_code == 403


def test_create_custom_field_and_value(client, db_session):
    fe = FinancialEntity(legal_name="API CF", country_code="IE")
    db_session.add(fe)
    db_session.flush()
    _get_module(db_session, "THIRD_PARTY_RISK")

    create = client.post(
        f"/api/organizations/{fe.id}/custom-fields",
        headers=_headers(fe.id),
        json={
            "entity_type": "ict_service",
            "field_key": "recovery_tier",
            "display_name": "Recovery Tier",
            "field_type": "SELECT",
            "options": ["Tier 1", "Tier 2"],
            "required": True,
        },
    )
    assert create.status_code == 201
    entity_id = uuid.uuid4()
    bad = client.post(
        f"/api/organizations/{fe.id}/custom-field-values",
        headers=_headers(fe.id),
        json={
            "entity_type": "ict_service",
            "entity_id": str(entity_id),
            "field_key": "recovery_tier",
            "value": "Tier 99",
        },
    )
    assert bad.status_code == 400
    good = client.post(
        f"/api/organizations/{fe.id}/custom-field-values",
        headers=_headers(fe.id),
        json={
            "entity_type": "ict_service",
            "entity_id": str(entity_id),
            "field_key": "recovery_tier",
            "value": "Tier 1",
        },
    )
    assert good.status_code == 200


def test_enable_module(client, db_session):
    fe = FinancialEntity(legal_name="Mod Org", country_code="DE")
    db_session.add(fe)
    db_session.flush()
    _get_module(db_session, "EVIDENCE_MANAGEMENT")
    resp = client.post(
        f"/api/organizations/{fe.id}/modules/EVIDENCE_MANAGEMENT/enable",
        headers=_headers(fe.id),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "enabled"
