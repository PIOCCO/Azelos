from uuid import UUID

from sqlalchemy import func, or_, select

from app.models.risk import RiskAssessment
from app.repositories.base import OrgScopedRepository


class RiskRepository(OrgScopedRepository):
    def get(self, risk_id: UUID) -> RiskAssessment | None:
        row = self.db.get(RiskAssessment, risk_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(
        self, page: int, page_size: int, *, q: str | None = None
    ) -> tuple[list[RiskAssessment], int]:
        base = select(RiskAssessment).where(
            RiskAssessment.financial_entity_id == self.organization_id
        )
        if q:
            term = f"%{q.strip()}%"
            base = base.where(
                or_(
                    RiskAssessment.title.ilike(term),
                    RiskAssessment.assessor.ilike(term),
                )
            )
        total = self.db.scalar(select(func.count()).select_from(base.subquery())) or 0
        rows = self.db.scalars(
            base.order_by(RiskAssessment.calculated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def create(self, row: RiskAssessment) -> RiskAssessment:
        row.financial_entity_id = self.organization_id
        self.db.add(row)
        self.db.flush()
        return row
