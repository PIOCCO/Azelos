from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.dora_baseline import OrganizationRequirement
from app.models.dora_control import ContractDoraControl, EvidenceControlLink
from app.models.enums import AuditAction
from app.models.evidence import Evidence
from app.models.requirement_evidence import RequirementEvidenceLink
from app.services.platform_audit import record_platform_audit


class EvidenceLinkService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def link_control(self, evidence_id: UUID, contract_control_id: UUID, actor: str) -> EvidenceControlLink:
        evidence = self.db.scalar(
            select(Evidence).where(
                Evidence.id == evidence_id,
                Evidence.financial_entity_id == self.organization_id,
            )
        )
        control = self.db.scalar(
            select(ContractDoraControl).where(
                ContractDoraControl.id == contract_control_id,
                ContractDoraControl.financial_entity_id == self.organization_id,
            )
        )
        if evidence is None or control is None:
            raise AppError("NOT_FOUND", "Evidence or control not found", 404)
        link = EvidenceControlLink(evidence_id=evidence_id, contract_control_id=contract_control_id)
        self.db.add(link)
        self.db.flush()
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="EvidenceControlLink",
            entity_id=link.id,
            action=AuditAction.UPDATE,
        )
        return link

    def link_requirement(
        self, evidence_id: UUID, organization_requirement_id: UUID, actor: str
    ) -> RequirementEvidenceLink:
        evidence = self.db.scalar(
            select(Evidence).where(
                Evidence.id == evidence_id,
                Evidence.financial_entity_id == self.organization_id,
            )
        )
        org_req = self.db.scalar(
            select(OrganizationRequirement).where(
                OrganizationRequirement.id == organization_requirement_id,
                OrganizationRequirement.financial_entity_id == self.organization_id,
            )
        )
        if evidence is None or org_req is None:
            raise AppError("NOT_FOUND", "Evidence or requirement not found", 404)
        link = RequirementEvidenceLink(
            financial_entity_id=self.organization_id,
            evidence_id=evidence_id,
            organization_requirement_id=organization_requirement_id,
        )
        self.db.add(link)
        self.db.flush()
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="RequirementEvidenceLink",
            entity_id=link.id,
            action=AuditAction.UPDATE,
        )
        return link
