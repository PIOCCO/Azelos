"""Applicability admin configuration + rules enforcement."""

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity
from app.models.organization_profile import OrganizationProfile
from app.models.platform_config import OrganizationModule, PlatformModule
from app.models.profile_rules import ProfileRule
from app.services.applicability import ApplicabilityService


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


def _admin_client(client, db_session, legal_name: str = "Appl Org"):
    org = FinancialEntity(legal_name=legal_name, country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(
        email=f"{legal_name.lower().replace(' ', '')}@test.com",
        hashed_password=hash_password("password12345"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id,
            financial_entity_id=org.id,
            role=Role.ORG_ADMIN,
        )
    )
    db_session.flush()
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": user.email,
            "password": "password12345",
            "organization_id": str(org.id),
        },
    )
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    return org, headers


def _module(db_session, key: str) -> PlatformModule:
    mod = db_session.scalar(select(PlatformModule).where(PlatformModule.key == key))
    assert mod is not None, f"seed module {key} missing"
    return mod


def test_required_module_cannot_be_disabled_via_api(client, db_session):
    org, headers = _admin_client(client, db_session, "Req Org")
    ict = _module(db_session, "ICT_RISK")
    db_session.add(
        ProfileRule(
            rule_key=f"test_require_ict_{uuid.uuid4().hex[:8]}",
            description="test",
            conditions={"organization_type": "credit_institution"},
            outcomes={"module_keys": ["ICT_RISK"]},
            active=True,
            system_defined=False,
        )
    )
    db_session.flush()

    get_resp = client.get(f"/api/v1/organizations/{org.id}/applicability", headers=headers)
    assert get_resp.status_code == 200
    ict_row = next(m for m in get_resp.json()["modules"] if m["key"] == "ICT_RISK")
    assert ict_row["required"] is True
    assert ict_row["final_status"] == "required"
    assert ict_row["enabled"] is True
    assert ict_row["admin_can_disable"] is False

    patch = client.patch(
        f"/api/v1/organizations/{org.id}/applicability/modules/ICT_RISK",
        headers=headers,
        json={"enabled": False},
    )
    assert patch.status_code == 403

    after = ApplicabilityService(db_session, org.id).build_response()
    mod = next(m for m in after.modules if m.key == "ICT_RISK")
    assert mod.enabled is True
    assert mod.required is True


def test_optional_module_enable_persists(client, db_session):
    org, headers = _admin_client(client, db_session, "Opt Org")
    bc = _module(db_session, "BUSINESS_CONTINUITY")
    db_session.add(
        OrganizationModule(
            financial_entity_id=org.id,
            platform_module_id=bc.id,
            enabled=False,
        )
    )
    db_session.flush()

    patch = client.patch(
        f"/api/v1/organizations/{org.id}/applicability/modules/BUSINESS_CONTINUITY",
        headers=headers,
        json={"enabled": True},
    )
    assert patch.status_code == 200, patch.text
    body = patch.json()
    assert body["final_status"] == "optional"
    assert body["enabled"] is True
    assert body["enable_reason"] == "enabled_by_organization_administrator"

    refresh = client.get(f"/api/v1/organizations/{org.id}/applicability", headers=headers)
    bc_row = next(m for m in refresh.json()["modules"] if m["key"] == "BUSINESS_CONTINUITY")
    assert bc_row["enabled"] is True
    assert bc_row["admin_enabled"] is True


def test_recommended_module_toggle(client, db_session):
    org, headers = _admin_client(client, db_session, "Rec Org")
    res = _module(db_session, "RESILIENCE_TESTING")
    db_session.add(
        ProfileRule(
            rule_key=f"test_recommend_resilience_{uuid.uuid4().hex[:8]}",
            description="test",
            conditions={"organization_type": "credit_institution"},
            outcomes={"module_resilience_testing_recommended": True},
            active=True,
            system_defined=False,
        )
    )
    db_session.add(
        OrganizationModule(
            financial_entity_id=org.id,
            platform_module_id=res.id,
            enabled=False,
        )
    )
    db_session.flush()

    before = client.get(f"/api/v1/organizations/{org.id}/applicability", headers=headers)
    res_row = next(m for m in before.json()["modules"] if m["key"] == "RESILIENCE_TESTING")
    assert res_row["recommended"] is True
    assert res_row["rule_result"] == "recommended"

    enable = client.patch(
        f"/api/v1/organizations/{org.id}/applicability/modules/RESILIENCE_TESTING",
        headers=headers,
        json={"enabled": True},
    )
    assert enable.status_code == 200
    assert enable.json()["final_status"] == "optional"

    disable = client.patch(
        f"/api/v1/organizations/{org.id}/applicability/modules/RESILIENCE_TESTING",
        headers=headers,
        json={"enabled": False},
    )
    assert disable.status_code == 200
    assert disable.json()["final_status"] == "not_enabled"


def test_cross_tenant_module_patch_denied(client, db_session):
    org_a, headers_a = _admin_client(client, db_session, "Tenant A")
    org_b, _ = _admin_client(client, db_session, "Tenant B")
    resp = client.patch(
        f"/api/v1/organizations/{org_b.id}/applicability/modules/BUSINESS_CONTINUITY",
        headers=headers_a,
        json={"enabled": True},
    )
    assert resp.status_code == 403


def test_config_api_rejects_disable_required_module(client, db_session):
    org, headers = _admin_client(client, db_session, "Cfg Org")
    db_session.add(
        ProfileRule(
            rule_key=f"test_require_evidence_{uuid.uuid4().hex[:8]}",
            description="test",
            conditions={"organization_type": "credit_institution"},
            outcomes={"module_keys": ["EVIDENCE_MANAGEMENT"]},
            active=True,
            system_defined=False,
        )
    )
    db_session.flush()
    resp = client.post(
        "/api/v1/config/modules/EVIDENCE_MANAGEMENT",
        headers=headers,
        json={"enabled": False},
    )
    assert resp.status_code == 403
