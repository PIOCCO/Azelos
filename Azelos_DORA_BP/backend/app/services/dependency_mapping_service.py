from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.business_function import BusinessFunction, FunctionServiceMapping
from app.models.enums import AuditAction
from app.models.service import ICTService
from app.services.platform_audit import record_platform_audit


class DependencyMappingService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def link_function_service(self, function_id: UUID, service_id: UUID, actor: str) -> FunctionServiceMapping:
        bf = self.db.get(BusinessFunction, function_id)
        svc = self.db.get(ICTService, service_id)
        if bf is None or bf.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Business function not found", 404)
        if svc is None or svc.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "ICT service not found", 404)
        existing = self.db.scalar(
            select(FunctionServiceMapping).where(
                FunctionServiceMapping.function_id == function_id,
                FunctionServiceMapping.service_id == service_id,
            )
        )
        if existing:
            return existing
        row = FunctionServiceMapping(function_id=function_id, service_id=service_id)
        self.db.add(row)
        self.db.flush()
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="FunctionServiceMapping",
            entity_id=row.id,
            action=AuditAction.CREATE,
        )
        return row

    def unlink_function_service(self, function_id: UUID, service_id: UUID, actor: str) -> None:
        row = self.db.scalar(
            select(FunctionServiceMapping).where(
                FunctionServiceMapping.function_id == function_id,
                FunctionServiceMapping.service_id == service_id,
            )
        )
        if row is None:
            raise AppError("NOT_FOUND", "Mapping not found", 404)
        bf = self.db.get(BusinessFunction, function_id)
        if bf is None or bf.financial_entity_id != self.organization_id:
            raise AppError("FORBIDDEN", "Forbidden", 403)
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="FunctionServiceMapping",
            entity_id=row.id,
            action=AuditAction.DELETE,
        )
        self.db.delete(row)
