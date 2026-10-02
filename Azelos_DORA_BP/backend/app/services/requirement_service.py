from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.repositories.requirements import RequirementRepository
from app.schemas.requirements import (
    OrganizationRequirementDetailOut,
    OrganizationRequirementUpdate,
    RegulatoryRequirementOut,
    RequirementEvidenceFileOut,
)
from app.services.evidence_attachment_service import EvidenceAttachmentService, EvidenceEntityType
from app.models.enums import AuditAction
from app.services.platform_audit import record_platform_audit


class RequirementService:
    def __init__(self, db: Session, organization_id: UUID | None = None) -> None:
        self.db = db
        self.organization_id = organization_id

    def list_baseline(self) -> list[RegulatoryRequirementOut]:
        rows = RequirementRepository(self.db).list_baseline()
        return [RegulatoryRequirementOut.model_validate(r) for r in rows]

    def get_baseline(self, requirement_id: UUID) -> RegulatoryRequirementOut:
        row = RequirementRepository(self.db).get_baseline(requirement_id)
        if row is None:
            raise AppError("NOT_FOUND", "Requirement not found", 404)
        return RegulatoryRequirementOut.model_validate(row)

    def _evidence_by_requirement(self) -> dict[UUID, list[RequirementEvidenceFileOut]]:
        assert self.organization_id is not None
        grouped = EvidenceAttachmentService(self.db, self.organization_id).grouped_for_entity_type(
            EvidenceEntityType.ORGANIZATION_REQUIREMENT
        )
        return {
            req_id: [
                RequirementEvidenceFileOut(
                    link_id=f.link_id or f.evidence_id,
                    evidence_id=f.evidence_id,
                    file_name=f.file_name,
                    uploaded_at=f.uploaded_at,
                )
                for f in files
            ]
            for req_id, files in grouped.items()
        }

    def list_organization_status(self) -> list[OrganizationRequirementDetailOut]:
        if self.organization_id is None:
            raise AppError("FORBIDDEN", "Organization required", 403)
        rows = RequirementRepository(self.db, self.organization_id).list_organization_implementation()
        evidence_map = self._evidence_by_requirement()
        out: list[OrganizationRequirementDetailOut] = []
        for row in rows:
            out.append(
                OrganizationRequirementDetailOut(
                    id=row.id,
                    dora_requirement_id=row.dora_requirement_id,
                    code=row.requirement.code,
                    title=row.requirement.title,
                    applicable=row.applicable,
                    implementation_status=row.implementation_status,
                    owner=row.owner,
                    notes=row.notes,
                    evidence_files=evidence_map.get(row.id, []),
                )
            )
        return out

    def update_organization_requirement(
        self, org_requirement_id, data: OrganizationRequirementUpdate, actor: str
    ) -> OrganizationRequirementDetailOut:
        if self.organization_id is None:
            raise AppError("FORBIDDEN", "Organization required", 403)
        repo = RequirementRepository(self.db, self.organization_id)
        row = repo.get_organization_requirement(org_requirement_id)
        if row is None:
            raise AppError("NOT_FOUND", "Organization requirement not found", 404)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="OrganizationRequirement",
            entity_id=row.id,
            action=AuditAction.UPDATE,
            new_value=data.model_dump(exclude_unset=True),
        )
        self.db.flush()
        evidence_map = self._evidence_by_requirement()
        return OrganizationRequirementDetailOut(
            id=row.id,
            dora_requirement_id=row.dora_requirement_id,
            code=row.requirement.code,
            title=row.requirement.title,
            applicable=row.applicable,
            implementation_status=row.implementation_status,
            owner=row.owner,
            notes=row.notes,
            evidence_files=evidence_map.get(row.id, []),
        )
