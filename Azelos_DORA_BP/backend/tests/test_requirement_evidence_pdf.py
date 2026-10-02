"""Requirement-scoped PDF evidence and DORA PDF export."""

import io

import pytest
from fastapi.testclient import TestClient

MIN_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


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


def _seed_org_with_requirement(db_session):
    from app.core.passwords import hash_password
    from app.core.rbac import Role
    from app.models.auth import OrganizationMembership, User
    from app.models.dora_baseline import DoraDomain, DoraRequirement, OrganizationRequirement
    from app.models.evidence import DocumentType
    from app.models.financial_entity import FinancialEntity

    org = FinancialEntity(legal_name="Req Ev Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(
        email="req-ev@example.com",
        hashed_password=hash_password("password12345"),
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(
            user_id=user.id,
            financial_entity_id=org.id,
            role=Role.SECURITY_MANAGER,
        )
    )
    domain = DoraDomain(code="TEST_DOM", name="Test domain")
    db_session.add(domain)
    db_session.flush()
    dora_req = DoraRequirement(
        domain_id=domain.id,
        code="MON-001",
        title="Monitoring",
        description="Monitoring control",
        system_immutable=True,
    )
    db_session.add(dora_req)
    db_session.flush()
    org_req_a = OrganizationRequirement(
        financial_entity_id=org.id,
        dora_requirement_id=dora_req.id,
        applicable=True,
        implementation_status="in_progress",
    )
    dora_req_b = DoraRequirement(
        domain_id=domain.id,
        code="DD-001",
        title="Due Diligence",
        description="Due diligence",
        system_immutable=True,
    )
    db_session.add(dora_req_b)
    db_session.flush()
    org_req_b = OrganizationRequirement(
        financial_entity_id=org.id,
        dora_requirement_id=dora_req_b.id,
        applicable=True,
        implementation_status="not_started",
    )
    db_session.add_all([org_req_a, org_req_b])
    if db_session.scalar(__import__("sqlalchemy").select(DocumentType).limit(1)) is None:
        db_session.add(DocumentType(code="audit_report", label="Audit report"))
    db_session.flush()
    return org, user, org_req_a, org_req_b


def _login(client, user, org):
    r = client.post(
        "/api/v1/auth/login",
        json={
            "email": user.email,
            "password": "password12345",
            "organization_id": str(org.id),
        },
    )
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_requirement_pdf_upload_lists_per_requirement(client, db_session):
    org, user, org_req_a, org_req_b = _seed_org_with_requirement(db_session)
    headers = _login(client, user, org)

    up = client.post(
        f"/api/v1/organizations/{org.id}/requirements/{org_req_a.id}/evidence",
        headers=headers,
        files={"file": ("monitoring.pdf", io.BytesIO(MIN_PDF), "application/pdf")},
    )
    assert up.status_code == 201
    evidence_id = up.json()["id"]

    listed = client.get(f"/api/v1/organizations/{org.id}/requirements", headers=headers)
    assert listed.status_code == 200
    by_id = {row["id"]: row for row in listed.json()}
    assert len(by_id[str(org_req_a.id)]["evidence_files"]) == 1
    assert by_id[str(org_req_a.id)]["evidence_files"][0]["file_name"] == "monitoring.pdf"
    assert by_id[str(org_req_b.id)]["evidence_files"] == []

    view = client.get(f"/api/v1/evidence/{evidence_id}/view", headers=headers)
    assert view.status_code == 200
    assert view.headers["content-type"].startswith("application/pdf")
    assert view.content.startswith(b"%PDF")

    dl = client.get(f"/api/v1/evidence/{evidence_id}/download", headers=headers)
    assert dl.status_code == 200
    assert dl.content.startswith(b"%PDF")


def test_requirement_evidence_idor_denied(client, db_session):
    org, user, org_req_a, _ = _seed_org_with_requirement(db_session)
    from app.models.financial_entity import FinancialEntity

    org2 = FinancialEntity(legal_name="Other", country_code="DE", status="active")
    db_session.add(org2)
    db_session.flush()
    headers = _login(client, user, org)
    r = client.post(
        f"/api/v1/organizations/{org2.id}/requirements/{org_req_a.id}/evidence",
        headers=headers,
        files={"file": ("x.pdf", io.BytesIO(MIN_PDF), "application/pdf")},
    )
    assert r.status_code == 403


def test_dora_assessment_pdf_export(client, db_session):
    org, user, _, _ = _seed_org_with_requirement(db_session)
    headers = _login(client, user, org)
    r = client.get("/api/v1/export/dora-assessment.pdf", headers=headers)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content.startswith(b"%PDF")
