"""Development seed: Demo European Bank with providers, chain, CIF mappings."""

from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import select

from app.database.session import SessionLocal
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
    ServiceClassification,
    Subcontractor,
)
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
from app.models.audit import AuditRecord, AuditAction


def seed() -> None:
    session = SessionLocal()
    try:
        existing = session.scalar(
            select(FinancialEntity).where(FinancialEntity.legal_name == "Demo European Bank")
        )
        if existing:
            print("Seed already applied (Demo European Bank exists).")
            return

        bank = FinancialEntity(
            legal_name="Demo European Bank",
            short_name="Demo Bank",
            lei="529900T8BM49AURSDO55",
            country_code="DE",
        )
        session.add(bank)
        session.flush()

        providers = {}
        for name, lei in [
            ("Provider A", "213800D1EI4B9WTWWD28"),
            ("Provider B", "98450064AFAAGAE6F141"),
            ("Provider C", "5493000IBP32UQZ0KL24"),
        ]:
            p = ICTProvider(
                financial_entity_id=bank.id,
                legal_name=name,
                lei=lei,
                country_code="IE",
                provider_type=ProviderType.ICT_THIRD_PARTY,
                status=ProviderStatus.ACTIVE,
            )
            session.add(p)
            session.flush()
            providers[name] = p

        cloud_x = Subcontractor(
            financial_entity_id=bank.id,
            provider_id=providers["Provider A"].id,
            legal_name="Cloud Provider X",
            lei="213800WAVVOPS85N2205",
            country_code="US",
            service_description="Hyperscale cloud infrastructure",
            processing_location="EU-West / US-East",
            depth_rank=0,
        )
        session.add(cloud_x)
        session.flush()

        cloud_x_b = Subcontractor(
            financial_entity_id=bank.id,
            provider_id=providers["Provider B"].id,
            parent_subcontractor_id=None,
            legal_name="Cloud Provider X",
            lei="213800WAVVOPS85N2205",
            country_code="US",
            service_description="Shared sub-cloud (concentration scenario)",
            processing_location="EU-West",
            depth_rank=0,
        )
        session.add(cloud_x_b)

        cloud_y = Subcontractor(
            financial_entity_id=bank.id,
            provider_id=providers["Provider C"].id,
            legal_name="Cloud Provider Y",
            country_code="NL",
            service_description="Regional cloud",
            depth_rank=0,
        )
        session.add(cloud_y)
        session.flush()

        tier2 = Subcontractor(
            financial_entity_id=bank.id,
            provider_id=providers["Provider A"].id,
            parent_subcontractor_id=cloud_x.id,
            legal_name="Data Centre Operator Z",
            country_code="DE",
            service_description="Colocation under Cloud X",
            depth_rank=1,
        )
        session.add(tier2)

        contracts = {}
        for prov_name, ref in [
            ("Provider A", "CTR-A-2024-001"),
            ("Provider B", "CTR-B-2023-014"),
            ("Provider C", "CTR-C-2025-002"),
        ]:
            c = Contract(
                financial_entity_id=bank.id,
                provider_id=providers[prov_name].id,
                reference_number=ref,
                contract_type=ContractType.OUTSOURCING,
                start_date=date(2023, 1, 1),
                end_date=date(2027, 12, 31),
                governing_law="DE",
                status=ContractStatus.ACTIVE,
                termination_notice_period_days=90,
            )
            session.add(c)
            session.flush()
            contracts[prov_name] = c

        classifications = {
            row.code: row
            for row in session.scalars(select(ServiceClassification)).all()
        }

        services = {}
        svc_specs = [
            ("Provider A", "Cloud Hosting", "cloud_hosting", CriticalOrImportant.CRITICAL),
            ("Provider B", "Identity Management", "identity_management", CriticalOrImportant.IMPORTANT),
            ("Provider C", "Payment Processing", "payment_processing", CriticalOrImportant.CRITICAL),
        ]
        for prov_name, svc_name, class_code, cif in svc_specs:
            s = ICTService(
                contract_id=contracts[prov_name].id,
                financial_entity_id=bank.id,
                name=svc_name,
                classification_id=classifications[class_code].id,
                data_processing_location="EU",
                data_storage_location="EU",
                data_location_country="DE",
                status=ServiceStatus.ACTIVE,
                supports_critical_or_important=cif,
            )
            session.add(s)
            session.flush()
            services[svc_name] = s

        functions = {}
        for name, ident, cif in [
            ("Payments", "BF-PAY", CriticalOrImportant.CRITICAL),
            ("Customer Data Management", "BF-CDM", CriticalOrImportant.IMPORTANT),
            ("Online Banking", "BF-OB", CriticalOrImportant.CRITICAL),
        ]:
            bf = BusinessFunction(
                financial_entity_id=bank.id,
                name=name,
                function_identifier=ident,
                critical_or_important=cif,
                exit_strategy_required=cif != CriticalOrImportant.NEITHER,
            )
            session.add(bf)
            session.flush()
            functions[name] = bf

        mappings = [
            (functions["Payments"], services["Payment Processing"]),
            (functions["Customer Data Management"], services["Cloud Hosting"]),
            (functions["Customer Data Management"], services["Identity Management"]),
            (functions["Online Banking"], services["Cloud Hosting"]),
            (functions["Online Banking"], services["Identity Management"]),
        ]
        for fn, svc in mappings:
            session.add(FunctionServiceMapping(function_id=fn.id, service_id=svc.id))

        control_def = session.scalar(
            select(DoraControlDefinition).where(
                DoraControlDefinition.code == "subcontracting"
            )
        )
        doc_type = session.scalar(
            select(DocumentType).where(DocumentType.code == "soc2_report")
        )

        for prov_name in providers:
            session.add(
                ContractDoraControl(
                    financial_entity_id=bank.id,
                    contract_id=contracts[prov_name].id,
                    control_definition_id=control_def.id,
                    compliance_status=ComplianceStatus.PENDING_REVIEW,
                    ai_suggested_status=ComplianceStatus.COMPLIANT,
                )
            )

        session.add(
            RiskAssessment(
                financial_entity_id=bank.id,
                provider_id=providers["Provider A"].id,
                criticality=RiskDimensionLevel.HIGH,
                data_sensitivity=RiskDimensionLevel.HIGH,
                substitutability=RiskDimensionLevel.MEDIUM,
                concentration_risk=RiskDimensionLevel.HIGH,
                geographic_risk=RiskDimensionLevel.MEDIUM,
                security_assurance=RiskDimensionLevel.MEDIUM,
                contract_gaps=RiskDimensionLevel.LOW,
                exit_feasibility=RiskDimensionLevel.MEDIUM,
                calculation_version="v1.0.0",
                resulting_risk_level=RiskLevel.HIGH,
                calculated_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
                assessor="risk.analyst@demo.bank",
                rationale="Initial onboarding assessment",
            )
        )
        session.add(
            RiskAssessment(
                financial_entity_id=bank.id,
                provider_id=providers["Provider A"].id,
                criticality=RiskDimensionLevel.VERY_HIGH,
                data_sensitivity=RiskDimensionLevel.HIGH,
                substitutability=RiskDimensionLevel.LOW,
                concentration_risk=RiskDimensionLevel.VERY_HIGH,
                geographic_risk=RiskDimensionLevel.MEDIUM,
                security_assurance=RiskDimensionLevel.MEDIUM,
                contract_gaps=RiskDimensionLevel.MEDIUM,
                exit_feasibility=RiskDimensionLevel.LOW,
                calculation_version="v1.1.0",
                resulting_risk_level=RiskLevel.CRITICAL,
                calculated_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
                assessor="risk.analyst@demo.bank",
                rationale="Shared Cloud Provider X across A and B",
            )
        )

        evidence = Evidence(
            financial_entity_id=bank.id,
            provider_id=providers["Provider A"].id,
            contract_id=contracts["Provider A"].id,
            document_type_id=doc_type.id,
            blob_uri="https://example.blob.core.windows.net/evidence/soc2-provider-a.pdf",
            file_name="soc2-provider-a.pdf",
            sha256_hash="a" * 64,
            expiry_date=date(2027, 1, 1),
            uploaded_by="compliance@demo.bank",
            verification_status=VerificationStatus.VERIFIED,
        )
        session.add(evidence)
        session.flush()

        session.add(
            ExitStrategy(
                financial_entity_id=bank.id,
                business_function_id=functions["Payments"].id,
                service_id=services["Payment Processing"].id,
                contract_id=contracts["Provider C"].id,
                provider_id=providers["Provider C"].id,
                exit_objective="Migrate payment processing to in-region backup provider within 12 months",
                alternative_provider_name="Provider C backup lane",
                migration_strategy="Parallel run with cutover weekend",
                rto_hours=4,
                rpo_hours=1,
                data_portability_notes="ISO 20022 export supported",
                test_date=date(2026, 3, 15),
                test_result=ExitTestResult.PASSED,
                status=ExitStrategyStatus.APPROVED,
                primary_evidence_id=evidence.id,
            )
        )

        session.add(
            AuditRecord(
                financial_entity_id=bank.id,
                actor="seed.script",
                entity_type="ict_provider",
                entity_id=providers["Provider A"].id,
                action=AuditAction.CREATE,
                new_value={"legal_name": "Provider A"},
                correlation_id="seed-001",
            )
        )

        session.commit()
        print("Development seed completed.")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
