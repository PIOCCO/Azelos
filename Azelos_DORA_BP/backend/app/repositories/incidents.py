from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models.operational import ICTIncident
from app.repositories.base import OrgScopedRepository


class IncidentRepository(OrgScopedRepository):
    def get(self, incident_id: UUID) -> ICTIncident | None:
        row = self.db.scalars(
            select(ICTIncident)
            .where(
                ICTIncident.id == incident_id,
                ICTIncident.financial_entity_id == self.organization_id,
                ICTIncident.archived_at.is_(None),
            )
            .options(
                selectinload(ICTIncident.links),
                selectinload(ICTIncident.timeline),
            )
        ).first()
        return row

    def list_paginated(
        self,
        page: int,
        page_size: int,
        *,
        status: str | None = None,
        severity: str | None = None,
        q: str | None = None,
    ) -> tuple[list[ICTIncident], int]:
        base = select(ICTIncident).where(
            ICTIncident.financial_entity_id == self.organization_id,
            ICTIncident.archived_at.is_(None),
        )
        if status:
            base = base.where(ICTIncident.status == status)
        if severity:
            base = base.where(ICTIncident.severity == severity)
        if q:
            base = base.where(ICTIncident.title.ilike(f"%{q.strip()}%"))
        total = self.db.scalar(select(func.count()).select_from(base.subquery())) or 0
        rows = self.db.scalars(
            base.order_by(ICTIncident.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(selectinload(ICTIncident.links))
        ).all()
        return list(rows), total

    def save(self, row: ICTIncident) -> ICTIncident:
        row.financial_entity_id = self.organization_id
        self.db.add(row)
        self.db.flush()
        return row
