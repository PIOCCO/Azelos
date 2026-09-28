"""Database integration tests for DORA supplier risk schema."""

from datetime import date, datetime, timezone
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.models import (
    BusinessFunction,
    Contract,
    ContractDoraControl,
    DocumentType,
    DoraControlDefinition,
    Evidence,
    ExitStrategy,
    FinancialEntity,
    FunctionServiceMapping,
    ICTProvider,
    ICTService,
    RiskAssessment,
    Subcontractor,
)
from app.models.audit import AuditRecord, AuditAction
from app.models.enums import (
    ComplianceStatus,
    ContractStatus,
    ContractType,
    CriticalOrImportant,
    ExitStrategyStatus,
    ExitTestResult,
    ProviderStatus,
    ProviderType,
    RiskDimensionLevel,
    RiskLevel,
    ServiceStatus,
    VerificationStatus,
)


def test_create_financial_entity(db_session):
    fe = FinancialEntity(legal_name="Test Bank", country_code="FR")
    db_session.add(fe)
    db_session.flush()
    assert fe.id is not None


def test_create_provider(db_session):
    fe = FinancialEntity(legal_name="Bank", country_code="DE")
    db_session.add(fe)
    db_session.flush()
    provider = ICTProvider(
        financial_entity_id=fe.id,
        legal_name="Provider A",
        lei="529900T8BM49AURSDO55",
        country_code="IE",
        provider_type=ProviderType.CLOUD_SERVICE,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(provider)
    db_session.flush()
    assert provider.id is not None


def test_create_contract(db_session):
    fe, provider = _bank_and_provider(db_session)
    contract = _contract(fe, provider, "CTR-001")
    db_session.add(contract)
    db_session.flush()
    assert contract.reference_number == "CTR-001"


def test_create_ict_service(db_session):
    fe, provider = _bank_and_provider(db_session)
    contract = _contract(fe, provider, "CTR-002")
    db_session.add(contract)
    db_session.flush()
    service = ICTService(
        contract_id=contract.id,
        financial_entity_id=fe.id,
        name="Cloud Hosting",
        status=ServiceStatus.ACTIVE,
        supports_critical_or_important=CriticalOrImportant.CRITICAL,
    )
    db_session.add(service)
    db_session.flush()
    assert service.contract_id == contract.id


def test_create_business_function(db_session):
    fe = FinancialEntity(legal_name="Bank", country_code="LU")
    db_session.add(fe)
    db_session.flush()
    bf = BusinessFunction(
        financial_entity_id=fe.id,
        name="Payments",
        function_identifier="BF-PAY",
        critical_or_important=CriticalOrImportant.CRITICAL,
    )
    db_session.add(bf)
    db_session.flush()
    assert bf.critical_or_important == CriticalOrImportant.CRITICAL


def test_function_service_mapping(db_session):
    fe, provider = _bank_and_provider(db_session)
    contract = _contract(fe, provider, "CTR-003")
    db_session.add(contract)
    db_session.flush()
    service = ICTService(
        contract_id=contract.id,
        financial_entity_id=fe.id,
        name="IAM",
        status=ServiceStatus.ACTIVE,
        supports_critical_or_important=CriticalOrImportant.IMPORTANT,
    )
    bf = BusinessFunction(
        financial_entity_id=fe.id,
        name="Online Banking",
        function_identifier="BF-OB",
        critical_or_important=CriticalOrImportant.CRITICAL,
    )
    db_session.add_all([service, bf])
    db_session.flush()
    db_session.add(FunctionServiceMapping(function_id=bf.id, service_id=service.id))
    db_session.flush()


def test_subcontractor_chain(db_session):
    fe, provider = _bank_and_provider(db_session)
    root = Subcontractor(
        financial_entity_id=fe.id,
        provider_id=provider.id,
        legal_name="Cloud X",
        country_code="US",
        depth_rank=0,
    )
    db_session.add(root)
    db_session.flush()
    child = Subcontractor(
        financial_entity_id=fe.id,
        provider_id=provider.id,
        parent_subcontractor_id=root.id,
        legal_name="DC Operator",
        country_code="DE",
        depth_rank=1,
    )
    db_session.add(child)
    db_session.flush()
    assert child.parent_subcontractor_id == root.id


def test_risk_assessment_history(db_session):
    fe, provider = _bank_and_provider(db_session)
    for level, when in [(RiskLevel.HIGH, datetime(2026, 1, 1, tzinfo=timezone.utc)), (RiskLevel.CRITICAL, datetime(2026, 6, 1, tzinfo=timezone.utc))]:
        db_session.add(_risk(fe, provider, level, when))
    db_session.flush()
    rows = db_session.scalars(
        select(RiskAssessment).where(RiskAssessment.provider_id == provider.id)
    ).all()
    assert len(rows) == 2


def test_create_evidence(db_session):
    fe, provider = _bank_and_provider(db_session)
    contract = _contract(fe, provider, "CTR-EV")
    db_session.add(contract)
    db_session.flush()
    doc_type = db_session.scalar(select(DocumentType).limit(1))
    ev = Evidence(
        financial_entity_id=fe.id,
        provider_id=provider.id,
        contract_id=contract.id,
        document_type_id=doc_type.id,
        blob_uri="https://blob/example.pdf",
        file_name="example.pdf",
        sha256_hash="b" * 64,
        uploaded_by="user@bank",
        verification_status=VerificationStatus.UNVERIFIED,
    )
    db_session.add(ev)
    db_session.flush()


def test_create_dora_controls(db_session):
    fe, provider = _bank_and_provider(db_session)
    contract = _contract(fe, provider, "CTR-DC")
    db_session.add(contract)
    db_session.flush()
    control = db_session.scalar(select(DoraControlDefinition).limit(1))
    row = ContractDoraControl(
        financial_entity_id=fe.id,
        contract_id=contract.id,
        control_definition_id=control.id,
        compliance_status=ComplianceStatus.NOT_ASSESSED,
    )
    db_session.add(row)
    db_session.flush()


def test_create_exit_strategy(db_session):
    fe, provider = _bank_and_provider(db_session)
    contract = _contract(fe, provider, "CTR-EX")
    bf = BusinessFunction(
        financial_entity_id=fe.id,
        name="Payments",
        function_identifier="BF-PAY-EX",
        critical_or_important=CriticalOrImportant.CRITICAL,
        exit_strategy_required=True,
    )
    db_session.add_all([contract, bf])
    db_session.flush()
    service = ICTService(
        contract_id=contract.id,
        financial_entity_id=fe.id,
        name="Pay Svc",
        status=ServiceStatus.ACTIVE,
        supports_critical_or_important=CriticalOrImportant.CRITICAL,
    )
    db_session.add(service)
    db_session.flush()
    db_session.add(
        ExitStrategy(
            financial_entity_id=fe.id,
            business_function_id=bf.id,
            service_id=service.id,
            contract_id=contract.id,
            provider_id=provider.id,
            exit_objective="Exit within 6 months",
            status=ExitStrategyStatus.DRAFT,
            test_result=ExitTestResult.NOT_TESTED,
        )
    )
    db_session.flush()


def test_audit_logging(db_session):
    fe = FinancialEntity(legal_name="Audit Bank", country_code="BE")
    db_session.add(fe)
    db_session.flush()
    db_session.add(
        AuditRecord(
            financial_entity_id=fe.id,
            actor="tester",
            entity_type="financial_entity",
            entity_id=fe.id,
            action=AuditAction.CREATE,
            new_value={"legal_name": "Audit Bank"},
        )
    )
    db_session.flush()


def test_foreign_key_failure_missing_provider(db_session):
    fe = FinancialEntity(legal_name="Bank", country_code="DE")
    db_session.add(fe)
    db_session.flush()
    contract = Contract(
        financial_entity_id=fe.id,
        provider_id=uuid4(),
        reference_number="BAD-REF",
        contract_type=ContractType.OTHER,
        start_date=date(2024, 1, 1),
        status=ContractStatus.ACTIVE,
    )
    db_session.add(contract)
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_duplicate_function_service_mapping(db_session):
    fe, provider = _bank_and_provider(db_session)
    contract = _contract(fe, provider, "CTR-DUP")
    db_session.add(contract)
    db_session.flush()
    service = ICTService(
        contract_id=contract.id,
        financial_entity_id=fe.id,
        name="Svc",
        status=ServiceStatus.ACTIVE,
        supports_critical_or_important=CriticalOrImportant.NEITHER,
    )
    bf = BusinessFunction(
        financial_entity_id=fe.id,
        name="Fn",
        function_identifier="BF-DUP",
        critical_or_important=CriticalOrImportant.IMPORTANT,
    )
    db_session.add_all([service, bf])
    db_session.flush()
    db_session.add(FunctionServiceMapping(function_id=bf.id, service_id=service.id))
    db_session.flush()
    db_session.add(FunctionServiceMapping(function_id=bf.id, service_id=service.id))
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_invalid_lei_rejection(db_session):
    fe = FinancialEntity(legal_name="Bank", country_code="DE")
    db_session.add(fe)
    db_session.flush()
    db_session.add(
        ICTProvider(
            financial_entity_id=fe.id,
            legal_name="Bad LEI Co",
            lei="NOT-A-VALID-LEI-CODE",
            country_code="DE",
            provider_type=ProviderType.OTHER,
            status=ProviderStatus.ACTIVE,
        )
    )
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_invalid_contract_dates(db_session):
    fe, provider = _bank_and_provider(db_session)
    contract = Contract(
        financial_entity_id=fe.id,
        provider_id=provider.id,
        reference_number="CTR-DATE",
        contract_type=ContractType.LICENSE,
        start_date=date(2025, 6, 1),
        end_date=date(2024, 1, 1),
        status=ContractStatus.ACTIVE,
    )
    db_session.add(contract)
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_cross_entity_isolation(db_session):
    fe1 = FinancialEntity(legal_name="Bank One", country_code="DE")
    fe2 = FinancialEntity(legal_name="Bank Two", country_code="FR")
    db_session.add_all([fe1, fe2])
    db_session.flush()
    provider2 = ICTProvider(
        financial_entity_id=fe2.id,
        legal_name="Provider Two",
        lei="213800D1EI4B9WTWWD28",
        country_code="FR",
        provider_type=ProviderType.ICT_THIRD_PARTY,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(provider2)
    db_session.flush()
    contract = Contract(
        financial_entity_id=fe1.id,
        provider_id=provider2.id,
        reference_number="CROSS-001",
        contract_type=ContractType.OUTSOURCING,
        start_date=date(2024, 1, 1),
        status=ContractStatus.ACTIVE,
    )
    db_session.add(contract)
    with pytest.raises(IntegrityError):
        db_session.flush()


def _bank_and_provider(db_session):
    fe = FinancialEntity(legal_name="Bank", country_code="DE")
    db_session.add(fe)
    db_session.flush()
    provider = ICTProvider(
        financial_entity_id=fe.id,
        legal_name="Provider",
        lei="529900T8BM49AURSDO55",
        country_code="IE",
        provider_type=ProviderType.ICT_THIRD_PARTY,
        status=ProviderStatus.ACTIVE,
    )
    db_session.add(provider)
    db_session.flush()
    return fe, provider


def _contract(fe, provider, reference: str) -> Contract:
    return Contract(
        financial_entity_id=fe.id,
        provider_id=provider.id,
        reference_number=reference,
        contract_type=ContractType.OUTSOURCING,
        start_date=date(2024, 1, 1),
        status=ContractStatus.ACTIVE,
    )


def _risk(fe, provider, level: RiskLevel, when: datetime) -> RiskAssessment:
    return RiskAssessment(
        financial_entity_id=fe.id,
        provider_id=provider.id,
        criticality=RiskDimensionLevel.MEDIUM,
        data_sensitivity=RiskDimensionLevel.MEDIUM,
        substitutability=RiskDimensionLevel.MEDIUM,
        concentration_risk=RiskDimensionLevel.MEDIUM,
        geographic_risk=RiskDimensionLevel.MEDIUM,
        security_assurance=RiskDimensionLevel.MEDIUM,
        contract_gaps=RiskDimensionLevel.MEDIUM,
        exit_feasibility=RiskDimensionLevel.MEDIUM,
        calculation_version="v1",
        resulting_risk_level=level,
        calculated_at=when,
        assessor="test@bank",
    )
