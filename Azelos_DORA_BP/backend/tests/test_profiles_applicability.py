import pytest

from app.models.enums import CriticalOrImportant
from app.models.enums_profile import OrganizationType
from app.models.financial_entity import FinancialEntity
from app.models.organization_profile import OrganizationProfile
from app.services.applicability import ApplicabilityService
from app.services.profile_service import ProfileService
from app.schemas.profile import OrganizationProfileUpdate


@pytest.fixture
def org(db_session):
    fe = FinancialEntity(legal_name="PayCo", country_code="DE", status="active")
    db_session.add(fe)
    db_session.flush()
    return fe


def test_profile_create_and_update(db_session, org):
    service = ProfileService(db_session, org.id)
    profile = service.get_or_create()
    assert profile.organization_type == OrganizationType.CREDIT_INSTITUTION
    updated = service.update(
        OrganizationProfileUpdate(
            organization_type=OrganizationType.PAYMENT_INSTITUTION,
            art16_eligible=True,
        )
    )
    assert updated.organization_type == OrganizationType.PAYMENT_INSTITUTION
    assert updated.art16_eligible is True


def test_applicability_payment_art16(db_session, org):
    profile = OrganizationProfile(
        financial_entity_id=org.id,
        organization_type=OrganizationType.PAYMENT_INSTITUTION,
        art16_eligible=True,
    )
    db_session.add(profile)
    db_session.flush()
    result = ApplicabilityService(db_session, org.id).evaluate()
    assert "payment_art16_simplified_rmf" in result.matched_rules
    assert result.flags.get("simplified_rmf") is True


def test_applicability_respects_disabled_module(db_session, org):
    from app.models.platform_config import OrganizationModule, PlatformModule

    profile = OrganizationProfile(
        financial_entity_id=org.id,
        tlpt_applicable=True,
    )
    db_session.add(profile)
    module = db_session.query(PlatformModule).first()
    if module is None:
        pytest.skip("No platform modules seeded")
    db_session.add(
        OrganizationModule(
            financial_entity_id=org.id,
            platform_module_id=module.id,
            enabled=False,
        )
    )
    db_session.flush()
    result = ApplicabilityService(db_session, org.id).evaluate()
    assert "tlpt_module_when_applicable" in result.matched_rules
    assert module.key not in result.enabled_modules
