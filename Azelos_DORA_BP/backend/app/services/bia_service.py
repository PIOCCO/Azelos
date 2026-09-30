from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.business_function import BusinessFunction
from app.models.bia import BusinessImpactAssessment
from app.models.enums import AuditAction
from app.services.platform_audit import record_platform_audit


class BiaService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def list_assessments(self) -> list[BusinessImpactAssessment]:
        return list(
            self.db.scalars(
                select(BusinessImpactAssessment).where(
                    BusinessImpactAssessment.financial_entity_id == self.organization_id
                )
            ).all()
        )

    def create(self, data: dict, actor: str) -> BusinessImpactAssessment:
        bf_id = data["business_function_id"]
        bf = self.db.get(BusinessFunction, bf_id)
        if bf is None or bf.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Business function not found", 404)
        row = BusinessImpactAssessment(financial_entity_id=self.organization_id, **data)
        self.db.add(row)
        self.db.flush()
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="BusinessImpactAssessment",
            entity_id=row.id,
            action=AuditAction.CREATE,
        )
        return row

    def update(self, bia_id: UUID, data: dict, actor: str) -> BusinessImpactAssessment:
        row = self.db.scalar(
            select(BusinessImpactAssessment).where(
                BusinessImpactAssessment.id == bia_id,
                BusinessImpactAssessment.financial_entity_id == self.organization_id,
            )
        )
        if row is None:
            raise AppError("NOT_FOUND", "BIA not found", 404)
        for key, val in data.items():
            setattr(row, key, val)
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="BusinessImpactAssessment",
            entity_id=row.id,
            action=AuditAction.UPDATE,
        )
        self.db.flush()
        return row
