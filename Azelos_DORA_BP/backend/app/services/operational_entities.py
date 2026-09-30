from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.enums import AuditAction
from app.models.operational import (
    BusinessContinuityPlan,
    DisasterRecoveryPlan,
    ResilienceTestCampaign,
    TlptExercise,
)
from app.services.platform_audit import record_platform_audit


class _OrgCrud:
    def __init__(self, db: Session, org_id: UUID, model, entity_type: str):
        self.db = db
        self.org_id = org_id
        self.model = model
        self.entity_type = entity_type

    def _get(self, row_id: UUID):
        row = self.db.get(self.model, row_id)
        if row is None or row.financial_entity_id != self.org_id or row.archived_at is not None:
            raise AppError("NOT_FOUND", f"{self.entity_type} not found", 404)
        return row

    def list(self, page: int, page_size: int):
        base = select(self.model).where(
            self.model.financial_entity_id == self.org_id,
            self.model.archived_at.is_(None),
        )
        total = self.db.scalar(select(func.count()).select_from(base.subquery())) or 0
        rows = self.db.scalars(
            base.order_by(self.model.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, row, actor: str):
        row.financial_entity_id = self.org_id
        self.db.add(row)
        self.db.flush()
        record_platform_audit(
            self.db,
            organization_id=self.org_id,
            actor=actor,
            entity_type=self.entity_type,
            entity_id=row.id,
            action=AuditAction.CREATE,
        )
        return row

    def update(self, row_id: UUID, patch: dict, actor: str):
        row = self._get(row_id)
        for k, v in patch.items():
            if v is not None:
                setattr(row, k, v)
        record_platform_audit(
            self.db,
            organization_id=self.org_id,
            actor=actor,
            entity_type=self.entity_type,
            entity_id=row.id,
            action=AuditAction.UPDATE,
            new_value=patch,
        )
        return row

    def archive(self, row_id: UUID, actor: str):
        row = self._get(row_id)
        row.archived_at = datetime.now(timezone.utc)
        record_platform_audit(
            self.db,
            organization_id=self.org_id,
            actor=actor,
            entity_type=self.entity_type,
            entity_id=row.id,
            action=AuditAction.DELETE,
            notes="archived",
        )
        return row


def resilience_test_service(db: Session, org_id: UUID) -> _OrgCrud:
    return _OrgCrud(db, org_id, ResilienceTestCampaign, "ResilienceTest")


def tlpt_service(db: Session, org_id: UUID) -> _OrgCrud:
    return _OrgCrud(db, org_id, TlptExercise, "TlptExercise")


def bcp_service(db: Session, org_id: UUID) -> _OrgCrud:
    return _OrgCrud(db, org_id, BusinessContinuityPlan, "BusinessContinuityPlan")


def drp_service(db: Session, org_id: UUID) -> _OrgCrud:
    return _OrgCrud(db, org_id, DisasterRecoveryPlan, "DisasterRecoveryPlan")
