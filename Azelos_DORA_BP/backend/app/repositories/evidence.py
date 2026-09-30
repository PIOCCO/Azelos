from uuid import UUID

from sqlalchemy import func, select

from app.models.evidence import Evidence
from app.repositories.base import OrgScopedRepository


class EvidenceRepository(OrgScopedRepository):
    def get(self, evidence_id: UUID) -> Evidence | None:
        row = self.db.get(Evidence, evidence_id)
        if row and row.financial_entity_id != self.organization_id:
            return None
        return row

    def list_paginated(self, page: int, page_size: int) -> tuple[list[Evidence], int]:
        total = (
            self.db.scalar(
                select(func.count(Evidence.id)).where(
                    Evidence.financial_entity_id == self.organization_id
                )
            )
            or 0
        )
        rows = self.db.scalars(
            select(Evidence)
            .where(Evidence.financial_entity_id == self.organization_id)
            .order_by(Evidence.uploaded_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total
