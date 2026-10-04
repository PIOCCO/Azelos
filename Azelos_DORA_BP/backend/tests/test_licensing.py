"""Cryptographic ADORA license enforcement."""

import copy
import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.licensing.enums import LicensePlan, LicenseStatus
from app.licensing.schema import LicenseEnvelope
from app.licensing.service import LicenseService
from app.licensing.signing import build_payload, dev_signing_private_key, sign_payload
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity
from app.models.saas import UserInvitation
from app.services.tenant_provisioning import TenantProvisioningService
from tests.licensing_utils import make_signed_envelope


@pytest.fixture
def client(db_session, monkeypatch):
    monkeypatch.setenv("ADORA_LICENSE_ENFORCEMENT", "1")
    from contextlib import contextmanager

    from app.core.database import get_db
    from app.main import create_app

    @contextmanager
    def _session_local():
        yield db_session

    monkeypatch.setattr("app.core.license_gate.SessionLocal", _session_local)

    app = create_app()

    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    yield TestClient(app)
    app.dependency_overrides.clear()


def _org_admin(db_session):
    org = FinancialEntity(legal_name="Lic Org", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(
        email=f"admin-{uuid4().hex[:8]}@example.com",
        hashed_password=hash_password("password12345"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.ORG_ADMIN)
    )
    TenantProvisioningService(db_session)._seed_org_requirements(org.id)
    db_session.flush()
    return org, user


def _login(client, user, org_id):
    return client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password12345", "organization_id": str(org_id)},
    )


def _install(client, token, envelope: LicenseEnvelope):
    return client.post(
        "/api/v1/license/install",
        headers={"Authorization": f"Bearer {token}"},
        json={"envelope": envelope.model_dump(mode="json")},
    )


def test_valid_license_allows_writes(client, db_session):
    org, user = _org_admin(db_session)
    env = make_signed_envelope(org.id)
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    inst = _install(client, token, env)
    assert inst.status_code == 200, inst.text
    db_session.flush()
    from app.models.dora_baseline import OrganizationRequirement

    org_req = db_session.query(OrganizationRequirement).filter_by(financial_entity_id=org.id).first()
    r = client.patch(
        f"/api/v1/organizations/{org.id}/requirements/{org_req.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"implementation_status": "in_progress"},
    )
    assert r.status_code == 200, r.text


def test_invalid_signature_rejected(client, db_session):
    org, user = _org_admin(db_session)
    env = make_signed_envelope(org.id)
    env.signature = "Y" * 88
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    assert _install(client, token, env).status_code == 400


def test_modified_license_payload_rejected(client, db_session):
    org, user = _org_admin(db_session)
    env = make_signed_envelope(org.id)
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    assert _install(client, token, env).status_code == 200
    row = LicenseService(db_session).get_installed_row(org.id)
    tampered = copy.deepcopy(row.envelope_json)
    tampered["payload"]["max_users"] = 999
    row.envelope_json = tampered
    db_session.flush()
    evaluation = LicenseService(db_session).evaluate_for_organization(org.id)
    assert evaluation.validation_ok is False
    r = client.post(
        "/api/v1/ict-providers",
        headers={"Authorization": f"Bearer {token}"},
        json={"legal_name": "X", "country_code": "DE"},
    )
    assert r.status_code == 403


def test_expired_license_read_only(client, db_session):
    org, user = _org_admin(db_session)
    now = datetime.now(timezone.utc)
    payload = build_payload(
        organization_id=org.id,
        customer_name="Expired",
        plan=LicensePlan.PILOT,
        starts_at=now - timedelta(days=120),
        expires_at=now - timedelta(days=1),
        max_users=10,
    )
    env = sign_payload(payload, dev_signing_private_key())
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    _install(client, token, env)
    db_session.flush()
    r = client.get(
        f"/api/v1/organizations/{org.id}/applicability",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    r = client.post(
        "/api/v1/ict-providers",
        headers={"Authorization": f"Bearer {token}"},
        json={"legal_name": "NewCo", "country_code": "DE"},
    )
    assert r.status_code == 403
    assert "read-only" in r.json()["error"]["message"].lower()


def test_future_start_license_blocks_writes(client, db_session):
    org, user = _org_admin(db_session)
    now = datetime.now(timezone.utc)
    payload = build_payload(
        organization_id=org.id,
        customer_name="Future",
        plan=LicensePlan.PILOT,
        starts_at=now + timedelta(days=7),
        expires_at=now + timedelta(days=97),
        max_users=10,
    )
    env = sign_payload(payload, dev_signing_private_key())
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    _install(client, token, env)
    db_session.flush()
    r = client.post(
        "/api/v1/ict-providers",
        headers={"Authorization": f"Bearer {token}"},
        json={"legal_name": "FutureCo", "country_code": "DE"},
    )
    assert r.status_code == 403


def test_revoked_license_blocks_writes(client, db_session):
    org, user = _org_admin(db_session)
    payload = build_payload(
        organization_id=org.id,
        customer_name="Revoked",
        plan=LicensePlan.ANNUAL,
        starts_at=datetime.now(timezone.utc) - timedelta(days=1),
        expires_at=datetime.now(timezone.utc) + timedelta(days=365),
        max_users=10,
        license_status=LicenseStatus.REVOKED,
    )
    env = sign_payload(payload, dev_signing_private_key())
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    _install(client, token, env)
    db_session.flush()
    r = client.post(
        "/api/v1/ict-providers",
        headers={"Authorization": f"Bearer {token}"},
        json={"legal_name": "RevCo", "country_code": "DE"},
    )
    assert r.status_code == 403


def test_wrong_organization_license(client, db_session):
    org, user = _org_admin(db_session)
    other = FinancialEntity(legal_name="Other", country_code="FR", status="active")
    db_session.add(other)
    db_session.flush()
    env = make_signed_envelope(other.id)
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    assert _install(client, token, env).status_code in (400, 422)


def test_malformed_license_envelope(client, db_session):
    org, user = _org_admin(db_session)
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    r = client.post(
        "/api/v1/license/install",
        headers={"Authorization": f"Bearer {token}"},
        json={"envelope": {"format_version": 99, "payload": {}, "signature": "x"}},
    )
    assert r.status_code == 422 or r.status_code == 400


def test_max_user_limit_blocks_invite(client, db_session):
    org, user = _org_admin(db_session)
    env = make_signed_envelope(org.id, max_users=1)
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    _install(client, token, env)
    db_session.flush()
    r = client.post(
        "/api/v1/memberships/invitations",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "extra@example.com", "role": "USER"},
    )
    assert r.status_code == 403


def test_existing_users_not_locked_at_max_users(client, db_session):
    org, user = _org_admin(db_session)
    user2 = User(
        email=f"u2-{uuid4().hex[:6]}@example.com",
        hashed_password=hash_password("password12345"),
        is_active=True,
    )
    db_session.add(user2)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user2.id, financial_entity_id=org.id, role=Role.USER)
    )
    env = make_signed_envelope(org.id, max_users=1)
    token = _login(client, user, org.id).json()["access_token"]
    _install(client, token, env)
    db_session.flush()
    r = _login(client, user2, org.id)
    assert r.status_code == 200, r.text


def test_enabled_modules_enforcement(client, db_session):
    org, user = _org_admin(db_session)
    env = make_signed_envelope(org.id, enabled_modules=["THIRD_PARTY_RISK"])
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    _install(client, token, env)
    db_session.flush()
    r = client.patch(
        f"/api/v1/organizations/{org.id}/applicability/modules/RESILIENCE_TESTING",
        headers={"Authorization": f"Bearer {token}"},
        json={"enabled": True},
    )
    assert r.status_code == 403


def test_license_renewal(client, db_session):
    org, user = _org_admin(db_session)
    now = datetime.now(timezone.utc)
    old = sign_payload(
        build_payload(
            organization_id=org.id,
            customer_name="Renew",
            plan=LicensePlan.PILOT,
            starts_at=now - timedelta(days=90),
            expires_at=now - timedelta(days=1),
            max_users=10,
        ),
        dev_signing_private_key(),
    )
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    _install(client, token, old)
    db_session.flush()
    new = make_signed_envelope(org.id, days_valid=365, plan=LicensePlan.ANNUAL)
    r = client.post(
        "/api/v1/license/replace",
        headers={"Authorization": f"Bearer {token}"},
        json={"envelope": new.model_dump(mode="json")},
    )
    assert r.status_code == 200
    db_session.flush()
    r = client.post(
        "/api/v1/ict-providers",
        headers={"Authorization": f"Bearer {token}"},
        json={"legal_name": "AfterRenew", "country_code": "DE"},
    )
    assert r.status_code in (200, 201), r.text


def test_admin_license_status(client, db_session):
    org, user = _org_admin(db_session)
    env = make_signed_envelope(org.id)
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    _install(client, token, env)
    r = client.get("/api/v1/license/status", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["validation_ok"] is True
    assert body["license_id"] is not None


def test_export_allowed_when_expired(client, db_session):
    org, user = _org_admin(db_session)
    now = datetime.now(timezone.utc)
    env = sign_payload(
        build_payload(
            organization_id=org.id,
            customer_name="Exp",
            plan=LicensePlan.PILOT,
            starts_at=now - timedelta(days=30),
            expires_at=now - timedelta(days=1),
            max_users=10,
        ),
        dev_signing_private_key(),
    )
    r = _login(client, user, org.id)
    token = r.json()["access_token"]
    _install(client, token, env)
    db_session.flush()
    r = client.get(
        "/api/v1/export/ict-providers.csv",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
