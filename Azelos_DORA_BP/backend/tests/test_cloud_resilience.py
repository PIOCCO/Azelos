"""Cloud resilience platform: tenant isolation, RBAC, RTO/RPO, recovery tests."""

import pytest
from fastapi.testclient import TestClient

from app.core.rbac import Role
from app.core.passwords import hash_password
from app.models.auth import OrganizationMembership, User
from app.models.cloud_resilience import (
    BusinessService,
    CloudAccount,
    ResilienceEvidenceItem,
)
from app.models.enums_resilience import CloudProviderType, EvidenceSourceKind
from app.models.financial_entity import FinancialEntity
from app.services.recovery_test_calc import compute_recovery_outcome
from app.models.enums_resilience import RecoveryTestOutcome


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


def _login(client, email, password, org_id):
    return client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "organization_id": str(org_id)},
    )


@pytest.fixture
def org_setup(db_session):
    org_a = FinancialEntity(legal_name="Bank A", country_code="DE", status="active")
    org_b = FinancialEntity(legal_name="Bank B", country_code="FR", status="active")
    db_session.add_all([org_a, org_b])
    db_session.flush()
    admin = User(email="admin-a@test.com", hashed_password=hash_password("pass"), is_active=True)
    user = User(email="user-a@test.com", hashed_password=hash_password("pass"), is_active=True)
    db_session.add_all([admin, user])
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=admin.id, financial_entity_id=org_a.id, role=Role.ORG_ADMIN
        )
    )
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org_a.id, role=Role.USER)
    )
    db_session.flush()
    acct_b = CloudAccount(
        financial_entity_id=org_b.id,
        provider=CloudProviderType.AZURE,
        display_name="B sub",
        subscription_id="sub-b",
    )
    svc_a = BusinessService(financial_entity_id=org_a.id, name="Payments")
    ev_b = ResilienceEvidenceItem(
        financial_entity_id=org_b.id,
        title="Secret doc",
        source_kind=EvidenceSourceKind.USER_ENTRY,
        collected_by="other",
    )
    db_session.add_all([acct_b, svc_a, ev_b])
    db_session.flush()
    return admin, user, org_a, org_b, acct_b, svc_a, ev_b


def test_cross_tenant_cloud_account_not_visible(client, org_setup):
    admin, _, org_a, _, acct_b, _, _ = org_setup
    token = _login(client, admin.email, "pass", org_a.id).json()["access_token"]
    r = client.get(
        f"/api/v1/cloud-accounts",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    ids = [i["subscription_id"] for i in r.json()["items"]]
    assert "sub-b" not in ids


def test_user_cannot_create_cloud_account(client, org_setup):
    _, user, org_a, _, _, _, _ = org_setup
    token = _login(client, user.email, "pass", org_a.id).json()["access_token"]
    r = client.post(
        "/api/v1/cloud-accounts",
        json={
            "display_name": "Prod",
            "subscription_id": "sub-a",
            "provider": "azure",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


def test_cross_tenant_resilience_evidence(client, org_setup):
    admin, _, org_a, _, _, _, ev_b = org_setup
    token = _login(client, admin.email, "pass", org_a.id).json()["access_token"]
    r = client.get("/api/v1/resilience/evidence", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_discovery_without_credentials(client, org_setup):
    admin, _, org_a, _, _, _, _ = org_setup
    token = _login(client, admin.email, "pass", org_a.id).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    create = client.post(
        "/api/v1/cloud-accounts",
        json={"display_name": "Lab", "subscription_id": "000", "provider": "azure"},
        headers=headers,
    )
    assert create.status_code == 201
    acct_id = create.json()["id"]
    disc = client.post(f"/api/v1/cloud-accounts/{acct_id}/discover", headers=headers)
    assert disc.status_code == 200
    assert disc.json()["resources_upserted"] == 0
    assert disc.json()["credentials_configured"] is False


def test_recovery_outcome_pass_and_fail():
    assert (
        compute_recovery_outcome(
            target_rto_minutes=120,
            target_rpo_minutes=15,
            actual_recovery_minutes=47,
            actual_data_loss_minutes=8,
        )
        == RecoveryTestOutcome.PASS
    )
    assert (
        compute_recovery_outcome(
            target_rto_minutes=60,
            target_rpo_minutes=10,
            actual_recovery_minutes=90,
            actual_data_loss_minutes=20,
        )
        == RecoveryTestOutcome.FAIL
    )


def test_business_service_rto_gap_on_detail(client, org_setup):
    admin, _, org_a, _, _, svc_a, _ = org_setup
    svc_a.rto_minutes = 120
    svc_a.measured_recovery_minutes = 150
    token = _login(client, admin.email, "pass", org_a.id).json()["access_token"]
    r = client.get(
        f"/api/v1/business-services/{svc_a.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["rto_gap_minutes"] == 30
