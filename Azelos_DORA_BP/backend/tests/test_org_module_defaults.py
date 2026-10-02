"""Default module assignments for new organizations."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.passwords import hash_password
from app.core.rbac import Role
from app.models.auth import OrganizationMembership, User
from app.models.financial_entity import FinancialEntity
from app.models.platform_config import OrganizationModule, PlatformModule


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


def test_applicability_enables_modules_for_org_without_rows(client, db_session):
    org = FinancialEntity(legal_name="Fresh Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    user = User(email="fresh@example.com", hashed_password=hash_password("password12345"), is_active=True)
    db_session.add(user)
    db_session.flush()
    db_session.add(
        OrganizationMembership(user_id=user.id, financial_entity_id=org.id, role=Role.ORG_ADMIN)
    )
    db_session.flush()
    mod = db_session.scalar(select(PlatformModule).where(PlatformModule.key == "ICT_RISK").limit(1))
    assert mod is not None, "Run migrations — platform_modules seed required"
    assert (
        db_session.query(OrganizationModule)
        .filter(OrganizationModule.financial_entity_id == org.id)
        .count()
        == 0
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "password12345", "organization_id": str(org.id)},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    r = client.get(
        f"/api/v1/organizations/{org.id}/modules",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    modules = r.json()
    assert len(modules) >= 1
    assert any(m["key"] == "ICT_RISK" and m["enabled"] for m in modules)
