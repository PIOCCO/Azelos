"""Fresh-tenant ICT chain: provider → contract → service → risk (no seed data)."""

import pytest
from fastapi.testclient import TestClient

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity
from app.models.provider import ICTProvider
from app.models.enums import ProviderStatus, ProviderType


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


def _super_admin(db_session):
    user = User(
        email="platform@azelos.example",
        hashed_password=hash_password("PlatformPass123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    org = FinancialEntity(legal_name="Platform", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id,
            financial_entity_id=org.id,
            role=Role.SUPER_ADMIN,
        )
    )
    db_session.flush()
    return user, org


def test_fresh_tenant_ict_chain_via_provision(client, db_session):
    super_user, platform_org = _super_admin(db_session)
    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": super_user.email,
            "password": "PlatformPass123!",
            "organization_id": str(platform_org.id),
        },
    )
    assert login.status_code == 200
    sa_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    prov = client.post(
        "/api/v1/tenant/provision",
        headers=sa_headers,
        json={
            "legal_name": "Helvetia Digital Bank AG",
            "country_code": "CH",
            "admin_email": "admin@helvetia-digital.example",
            "admin_password": "HelvetiaAdmin12!",
            "short_name": "Helvetia Digital",
        },
    )
    assert prov.status_code == 201
    org_id = prov.json()["organization_id"]
    admin_token = prov.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    provider = client.post(
        "/api/v1/ict-providers",
        headers=headers,
        json={"legal_name": "CloudCore Europe GmbH", "country_code": "DE"},
    )
    assert provider.status_code == 201
    provider_id = provider.json()["id"]

    contract = client.post(
        "/api/v1/contracts",
        headers=headers,
        json={
            "provider_id": provider_id,
            "reference_number": "HD-OUT-2026-001",
            "start_date": "2026-01-01",
        },
    )
    assert contract.status_code == 201
    contract_id = contract.json()["id"]

    service = client.post(
        "/api/v1/ict-services",
        headers=headers,
        json={
            "contract_id": contract_id,
            "name": "Managed payment processing",
            "supports_critical_or_important": "critical",
        },
    )
    assert service.status_code == 201
    service_id = service.json()["id"]

    bf = client.post(
        "/api/v1/business-functions",
        headers=headers,
        json={
            "name": "Retail payments",
            "function_identifier": "PAY-RETAIL",
            "critical_or_important": "critical",
        },
    )
    assert bf.status_code == 201
    fn_id = bf.json()["id"]

    dep = client.post(
        "/api/v1/dependencies/function-service",
        headers=headers,
        json={"business_function_id": fn_id, "ict_service_id": service_id},
    )
    assert dep.status_code == 201

    risk = client.post(
        "/api/v1/risks",
        headers=headers,
        json={
            "provider_id": provider_id,
            "contract_id": contract_id,
            "service_id": service_id,
            "title": "CloudCore concentration",
            "criticality": "high",
            "data_sensitivity": "high",
            "substitutability": "medium",
            "concentration_risk": "high",
            "geographic_risk": "low",
            "security_assurance": "medium",
            "contract_gaps": "low",
            "exit_feasibility": "medium",
            "assessor": "admin@helvetia-digital.example",
        },
    )
    assert risk.status_code == 201

    listed = client.get("/api/v1/contracts", headers=headers)
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["reference_number"] == "HD-OUT-2026-001"

    export = client.get("/api/v1/export/ict-providers.csv", headers=headers)
    assert export.status_code == 200
    assert "CloudCore" in export.text

    report = client.get("/api/v1/resilience/reports/business-resilience", headers=headers)
    assert report.status_code == 200
    body = report.json()
    assert body.get("report_type") == "business-resilience"
    assert "dashboard" in body


def test_cross_tenant_contract_patch_idor(client, db_session):
    org_a = FinancialEntity(legal_name="Tenant A", country_code="DE", status="active")
    org_b = FinancialEntity(legal_name="Tenant B", country_code="DE", status="active")
    db_session.add_all([org_a, org_b])
    db_session.flush()
    user_a = User(email="a-chain@example.com", hashed_password=hash_password("SecurePass123!"), is_active=True)
    db_session.add(user_a)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user_a.id, financial_entity_id=org_a.id, role=Role.ORG_ADMIN)
    )
    prov_b = ICTProvider(
        financial_entity_id=org_b.id,
        legal_name="B Provider",
        country_code="DE",
        provider_type=ProviderType.ICT_THIRD_PARTY,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(prov_b)
    db_session.flush()
    from app.models.contract import Contract
    from app.models.enums import ContractStatus, ContractType
    from datetime import date

    contract_b = Contract(
        financial_entity_id=org_b.id,
        provider_id=prov_b.id,
        reference_number="SECRET-B",
        contract_type=ContractType.OUTSOURCING,
        status=ContractStatus.ACTIVE,
        start_date=date(2026, 1, 1),
    )
    db_session.add(contract_b)
    db_session.flush()

    token_a = client.post(
        "/api/v1/auth/login",
        json={"email": user_a.email, "password": "SecurePass123!", "organization_id": str(org_a.id)},
    ).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    get_r = client.get(f"/api/v1/contracts/{contract_b.id}", headers=headers_a)
    assert get_r.status_code == 404

    patch_r = client.patch(
        f"/api/v1/contracts/{contract_b.id}",
        headers=headers_a,
        json={"status": "terminated"},
    )
    assert patch_r.status_code == 404
