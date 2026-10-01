"""Pilot / sales demo tenant — fictional data only, isolated by organization.

Run after migrations (and reference data from Alembic). Safe to re-run: skips if entity exists.

  cd backend && source .venv/bin/activate
  export DATABASE_URL=...
  python scripts/seed_pilot_demo.py

Demo login (pilot environments only — rotate before any real customer):
  Email:    pilot.admin@pilot-demo.example
  Password: PilotDemoAdmin12!

See docs/pilot/DEMO-SCENARIO.md for the walkthrough narrative.
"""

from __future__ import annotations

import hashlib
import sys
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models import (
    BusinessFunction,
    Contract,
    DocumentType,
    Evidence,
    FinancialEntity,
    FunctionServiceMapping,
    ICTAsset,
    ICTProvider,
    ICTService,
    OrganizationRequirement,
    RiskAssessment,
    ServiceClassification,
)
from app.models.dora_baseline import DoraRequirement
from app.models.enums import (
    ContractStatus,
    ContractType,
    CriticalOrImportant,
    ProviderStatus,
    ProviderType,
    RiskDimensionLevel,
    RiskLevel,
    ServiceStatus,
    VerificationStatus,
)
from app.models.enums_operational import (
    ContinuityPlanStatus,
    IncidentLinkKind,
    IncidentSeverity,
    IncidentStatus,
    ResilienceTestKind,
    ResilienceTestStatus,
)
from app.models.enums_profile import OrganizationSizeCategory, OrganizationType, RegulatoryStatus
from app.models.ict_assets import AssetFunctionMap, InformationAsset
from app.models.operational import (
    BusinessContinuityPlan,
    DisasterRecoveryPlan,
    ICTIncident,
    IncidentEntityLink,
    ResilienceTestCampaign,
)
from app.models.requirement_evidence import RequirementEvidenceLink
from app.models.saas import OrganizationSubscription
from app.models.enums_saas import SubscriptionStatus
from app.services.profile_service import ProfileService
from app.services.tenant_provisioning import TenantProvisioningService
from app.storage.factory import get_evidence_storage

PILOT_LEGAL_NAME = "Nordhaven Mutual Bank AG (Pilot Demo)"
PILOT_ADMIN_EMAIL = "pilot.admin@pilot-demo.example"
PILOT_ADMIN_PASSWORD = "PilotDemoAdmin12!"


def seed() -> None:
    session = SessionLocal()
    try:
        existing = session.scalar(
            select(FinancialEntity).where(FinancialEntity.legal_name == PILOT_LEGAL_NAME)
        )
        if existing:
            print(f"Pilot demo already present ({PILOT_LEGAL_NAME}).")
            return

        entity, _admin = TenantProvisioningService(session).provision_tenant(
            legal_name=PILOT_LEGAL_NAME,
            country_code="DE",
            admin_email=PILOT_ADMIN_EMAIL,
            admin_password=PILOT_ADMIN_PASSWORD,
            short_name="Nordhaven Demo",
            lei="254900DEMO0000000001",
            trial_days=365,
        )
        org_id = entity.id
        profile = ProfileService(session, org_id).get_or_create()
        profile.organization_type = OrganizationType.CREDIT_INSTITUTION
        profile.regulatory_status = RegulatoryStatus.AUTHORIZED
        profile.size_category = OrganizationSizeCategory.MEDIUM
        profile.has_critical_functions = True
        profile.tlpt_applicable = False

        # --- Providers (fictional names) ---
        provider_specs = [
            ("PaymentClear EU B.V.", "IE", "213800PAY00000000001"),
            ("SecureAuth Solutions Ltd", "GB", "213800IDM00000000002"),
            ("Nimbus Cloud Services AG", "DE", "213800CLD00000000003"),
        ]
        providers: dict[str, ICTProvider] = {}
        for name, country, lei in provider_specs:
            p = ICTProvider(
                financial_entity_id=org_id,
                legal_name=name,
                lei=lei,
                country_code=country,
                provider_type=ProviderType.ICT_THIRD_PARTY,
                status=ProviderStatus.ACTIVE,
            )
            session.add(p)
            session.flush()
            providers[name] = p

        contracts: dict[str, Contract] = {}
        for prov_name, ref in [
            ("PaymentClear EU B.V.", "NH-ICT-2024-PAY-001"),
            ("SecureAuth Solutions Ltd", "NH-ICT-2023-IAM-014"),
            ("Nimbus Cloud Services AG", "NH-ICT-2022-CLOUD-008"),
        ]:
            c = Contract(
                financial_entity_id=org_id,
                provider_id=providers[prov_name].id,
                reference_number=ref,
                contract_type=ContractType.OUTSOURCING,
                start_date=date(2022, 6, 1),
                end_date=date(2027, 5, 31),
                governing_law="DE",
                status=ContractStatus.ACTIVE,
                termination_notice_period_days=180,
            )
            session.add(c)
            session.flush()
            contracts[prov_name] = c

        classifications = {
            row.code: row for row in session.scalars(select(ServiceClassification)).all()
        }
        services: dict[str, ICTService] = {}
        svc_rows = [
            ("PaymentClear EU B.V.", "Retail SEPA Payment Switching", "payment_processing", CriticalOrImportant.CRITICAL),
            ("SecureAuth Solutions Ltd", "Customer IAM & MFA", "identity_management", CriticalOrImportant.IMPORTANT),
            ("Nimbus Cloud Services AG", "Hosted Application Platform", "cloud_hosting", CriticalOrImportant.CRITICAL),
        ]
        for prov_name, svc_name, class_code, cif in svc_rows:
            s = ICTService(
                contract_id=contracts[prov_name].id,
                financial_entity_id=org_id,
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

        pay_fn = BusinessFunction(
            financial_entity_id=org_id,
            name="Retail SEPA Payments",
            function_identifier="BF-SEPA-PAY",
            critical_or_important=CriticalOrImportant.CRITICAL,
            exit_strategy_required=True,
        )
        ob_fn = BusinessFunction(
            financial_entity_id=org_id,
            name="Digital Banking Channel",
            function_identifier="BF-DIGITAL",
            critical_or_important=CriticalOrImportant.CRITICAL,
            exit_strategy_required=True,
        )
        session.add_all([pay_fn, ob_fn])
        session.flush()

        for fn, svc in [
            (pay_fn, services["Retail SEPA Payment Switching"]),
            (ob_fn, services["Hosted Application Platform"]),
            (ob_fn, services["Customer IAM & MFA"]),
        ]:
            session.add(FunctionServiceMapping(function_id=fn.id, service_id=svc.id))

        info_asset = InformationAsset(
            financial_entity_id=org_id,
            name="Payment transaction ledger",
            asset_identifier="IA-PAY-LEDGER",
            description="Authoritative record of retail payment instructions (fictional).",
        )
        session.add(info_asset)
        session.flush()

        ict_asset = ICTAsset(
            financial_entity_id=org_id,
            information_asset_id=info_asset.id,
            name="PaymentClear processing cluster",
            asset_identifier="ICT-PAY-CLU-01",
            description="Logical ICT asset supporting payment switching.",
            inherent_criticality=CriticalOrImportant.CRITICAL,
        )
        session.add(ict_asset)
        session.flush()
        session.add(
            AssetFunctionMap(
                function_id=pay_fn.id,
                ict_asset_id=ict_asset.id,
                supports_critical_function=True,
            )
        )

        session.add(
            RiskAssessment(
                financial_entity_id=org_id,
                provider_id=providers["PaymentClear EU B.V."].id,
                contract_id=contracts["PaymentClear EU B.V."].id,
                service_id=services["Retail SEPA Payment Switching"].id,
                title="PaymentClear — critical payment dependency",
                criticality=RiskDimensionLevel.VERY_HIGH,
                data_sensitivity=RiskDimensionLevel.HIGH,
                substitutability=RiskDimensionLevel.LOW,
                concentration_risk=RiskDimensionLevel.MEDIUM,
                geographic_risk=RiskDimensionLevel.LOW,
                security_assurance=RiskDimensionLevel.MEDIUM,
                contract_gaps=RiskDimensionLevel.LOW,
                exit_feasibility=RiskDimensionLevel.MEDIUM,
                calculation_version="v1.0.0",
                resulting_risk_level=RiskLevel.HIGH,
                calculated_at=datetime(2025, 11, 1, tzinfo=timezone.utc),
                assessor=PILOT_ADMIN_EMAIL,
                rationale="Single active contract for retail SEPA switching; limited substitute under 90 days.",
            )
        )

        doc_type = session.scalar(
            select(DocumentType).where(DocumentType.code == "soc2_report")
        )
        storage = get_evidence_storage()
        file_body = (
            b"Nordhaven pilot demo - fictional SOC 2 excerpt for PaymentClear EU B.V.\n"
            b"Not a real audit report.\n"
        )
        object_key = f"evidence/pilot/{org_id}/paymentclear-soc2-demo.txt"
        storage.upload(object_key, file_body, content_type="text/plain")
        evidence = Evidence(
            financial_entity_id=org_id,
            provider_id=providers["PaymentClear EU B.V."].id,
            contract_id=contracts["PaymentClear EU B.V."].id,
            document_type_id=doc_type.id,
            storage_provider="local",
            storage_object_key=object_key,
            file_name="paymentclear-soc2-demo.txt",
            content_hash=hashlib.sha256(file_body).hexdigest(),
            content_type="text/plain",
            size_bytes=len(file_body),
            metadata_={"pilot_demo": True, "provider": "PaymentClear EU B.V."},
            expiry_date=date(2026, 12, 31),
            uploaded_by=PILOT_ADMIN_EMAIL,
            verification_status=VerificationStatus.VERIFIED,
        )
        session.add(evidence)
        session.flush()

        org_req = session.scalar(
            select(OrganizationRequirement)
            .join(DoraRequirement)
            .where(
                OrganizationRequirement.financial_entity_id == org_id,
                DoraRequirement.code.isnot(None),
            )
            .limit(1)
        )
        if org_req is None:
            org_req = session.scalars(
                select(OrganizationRequirement).where(
                    OrganizationRequirement.financial_entity_id == org_id
                )
            ).first()
        if org_req:
            org_req.implementation_status = "in_progress"
            org_req.owner = PILOT_ADMIN_EMAIL
            org_req.notes = "Pilot demo — contract and SOC evidence under review."
            session.add(
                RequirementEvidenceLink(
                    financial_entity_id=org_id,
                    organization_requirement_id=org_req.id,
                    evidence_id=evidence.id,
                )
            )

        incident = ICTIncident(
            financial_entity_id=org_id,
            title="Elevated latency on payment API (fictional)",
            description="Third-party payment gateway latency spike during peak hours.",
            severity=IncidentSeverity.MEDIUM,
            status=IncidentStatus.CONTAINED,
            is_major=False,
            owner="ict.ops@nordhaven-demo.example",
            detected_at=datetime(2025, 9, 12, 14, 30, tzinfo=timezone.utc),
            contained_at=datetime(2025, 9, 12, 16, 0, tzinfo=timezone.utc),
        )
        session.add(incident)
        session.flush()
        session.add(
            IncidentEntityLink(
                incident_id=incident.id,
                link_kind=IncidentLinkKind.ICT_SERVICE,
                linked_entity_id=services["Retail SEPA Payment Switching"].id,
            )
        )

        session.add(
            BusinessContinuityPlan(
                financial_entity_id=org_id,
                name="Retail payments BCP (demo)",
                status=ContinuityPlanStatus.ACTIVE,
                owner="bcm@nordhaven-demo.example",
                rto_minutes=240,
                rpo_minutes=15,
                backup_strategy="Active-passive switching with PaymentClear DR region.",
                last_review_at=date(2025, 6, 1),
            )
        )
        session.add(
            DisasterRecoveryPlan(
                financial_entity_id=org_id,
                name="Payment platform DRP (demo)",
                status=ContinuityPlanStatus.ACTIVE,
                owner="dr@nordhaven-demo.example",
                recovery_strategy="Failover to secondary PaymentClear endpoint.",
                failover_capability="Tested annually",
                last_recovery_test_at=date(2025, 3, 20),
            )
        )
        session.add(
            ResilienceTestCampaign(
                financial_entity_id=org_id,
                title="2025 payment failover tabletop (demo)",
                test_kind=ResilienceTestKind.BUSINESS_CONTINUITY,
                status=ResilienceTestStatus.COMPLETED,
                scenario="Loss of primary PaymentClear processing zone.",
                scope_summary="Retail SEPA Payments function",
                owner=PILOT_ADMIN_EMAIL,
                planned_date=date(2025, 3, 15),
                executed_at=datetime(2025, 3, 15, 9, 0, tzinfo=timezone.utc),
                outcome_summary="RTO met; documentation gaps noted for exit plan.",
                ict_asset_id=ict_asset.id,
            )
        )

        sub = session.scalar(
            select(OrganizationSubscription).where(
                OrganizationSubscription.financial_entity_id == org_id
            )
        )
        if sub:
            sub.status = SubscriptionStatus.ACTIVE

        session.commit()
        print("Pilot demo tenant seeded.")
        print(f"  Organization: {PILOT_LEGAL_NAME}")
        print(f"  Login: {PILOT_ADMIN_EMAIL} / {PILOT_ADMIN_PASSWORD}")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
