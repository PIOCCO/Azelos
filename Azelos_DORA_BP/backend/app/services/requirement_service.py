from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.repositories.requirements import RequirementRepository
from app.schemas.requirements import OrganizationRequirementDetailOut, RegulatoryRequirementOut


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

    def list_organization_status(self) -> list[OrganizationRequirementDetailOut]:
        if self.organization_id is None:
            raise AppError("FORBIDDEN", "Organization required", 403)
        rows = RequirementRepository(self.db, self.organization_id).list_organization_implementation()
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
                )
            )
        return out
