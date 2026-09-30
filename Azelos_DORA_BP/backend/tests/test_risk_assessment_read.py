from unittest.mock import patch

from app.models.enums import (
    ProviderStatus,
    ProviderType,
    RiskDimensionLevel,
    RiskLevel,
)
from app.models.financial_entity import FinancialEntity
from app.models.provider import ICTProvider
from app.models.risk import RiskAssessment
from app.repositories.risk_assessment_read import RiskAssessmentReader, RiskGraphSlice


def test_legacy_reader_lists_service_risks(db_session):
    org = FinancialEntity(legal_name="Legacy Risk Org", country_code="DE", status="active")
    db_session.add(org)
    db_session.flush()
    prov = ICTProvider(
        financial_entity_id=org.id,
        legal_name="Prov",
        country_code="DE",
        status=ProviderStatus.ACTIVE,
        provider_type=ProviderType.ICT_THIRD_PARTY,
    )
    db_session.add(prov)
    db_session.flush()
    risk = RiskAssessment(
        financial_entity_id=org.id,
        provider_id=prov.id,
        criticality=RiskDimensionLevel.MEDIUM,
        data_sensitivity=RiskDimensionLevel.MEDIUM,
        substitutability=RiskDimensionLevel.MEDIUM,
        concentration_risk=RiskDimensionLevel.MEDIUM,
        geographic_risk=RiskDimensionLevel.MEDIUM,
        security_assurance=RiskDimensionLevel.MEDIUM,
        contract_gaps=RiskDimensionLevel.MEDIUM,
        exit_feasibility=RiskDimensionLevel.MEDIUM,
        calculation_version="v1",
        resulting_risk_level=RiskLevel.HIGH,
        assessor="tester",
    )
    db_session.add(risk)
    db_session.commit()

    reader = RiskAssessmentReader(db_session)
    with patch(
        "app.repositories.risk_assessment_read.risk_lifecycle_columns_present",
        return_value=False,
    ):
        reader._use_orm = None
        row = reader.get(risk.id)
    assert isinstance(row, RiskGraphSlice)
    assert row.resulting_risk_level == RiskLevel.HIGH
