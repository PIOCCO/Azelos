"""Organization requirement rows are ensured for legacy tenants."""

from sqlalchemy import func, select

from app.models.dora_baseline import DoraRequirement, OrganizationRequirement
from app.models.financial_entity import FinancialEntity
from app.services.org_requirement_defaults import ensure_organization_requirements
from app.services.requirement_service import RequirementService


def test_ensure_organization_requirements_backfills_missing_rows(db_session):
    org = FinancialEntity(legal_name="Legacy Req Co", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()

    baseline_count = db_session.scalar(select(func.count()).select_from(DoraRequirement)) or 0
    assert baseline_count > 0
    org_rows_before = db_session.scalar(
        select(func.count())
        .select_from(OrganizationRequirement)
        .where(OrganizationRequirement.financial_entity_id == org.id)
    )
    assert org_rows_before == 0

    ensure_organization_requirements(db_session, org.id)
    listed = RequirementService(db_session, org.id).list_organization_status()
    assert len(listed) == baseline_count
