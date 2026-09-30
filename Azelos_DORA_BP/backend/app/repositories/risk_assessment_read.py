"""Read risk assessments when DB is behind migration 009 (legacy column set)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.schema_health import risk_lifecycle_columns_present
from app.models.enums import RiskLevel
from app.models.risk import RiskAssessment


@dataclass(frozen=True)
class RiskGraphSlice:
    id: UUID
    financial_entity_id: UUID
    provider_id: UUID | None
    contract_id: UUID | None
    service_id: UUID | None
    resulting_risk_level: RiskLevel
    calculated_at: datetime | None


_LEGACY_SELECT = """
SELECT
  id,
  financial_entity_id,
  provider_id,
  contract_id,
  service_id,
  resulting_risk_level::text AS resulting_risk_level,
  calculated_at
FROM risk_assessments
"""


def _row_to_slice(row) -> RiskGraphSlice:
    return RiskGraphSlice(
        id=row.id,
        financial_entity_id=row.financial_entity_id,
        provider_id=row.provider_id,
        contract_id=row.contract_id,
        service_id=row.service_id,
        resulting_risk_level=RiskLevel(row.resulting_risk_level),
        calculated_at=row.calculated_at,
    )


class RiskAssessmentReader:
    """Uses ORM when lifecycle columns exist; otherwise legacy SQL (graph-safe)."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self._use_orm: bool | None = None

    @property
    def use_orm(self) -> bool:
        if self._use_orm is None:
            self._use_orm = risk_lifecycle_columns_present(self.db)
        return self._use_orm

    def get(self, risk_id: UUID) -> RiskAssessment | RiskGraphSlice | None:
        if self.use_orm:
            return self.db.get(RiskAssessment, risk_id)
        row = self.db.execute(
            text(_LEGACY_SELECT + " WHERE id = :id LIMIT 1"),
            {"id": risk_id},
        ).one_or_none()
        return _row_to_slice(row) if row else None

    def list_for_service(self, org: UUID, service_id: UUID) -> list[RiskAssessment | RiskGraphSlice]:
        if self.use_orm:
            return list(
                self.db.scalars(
                    select(RiskAssessment).where(
                        RiskAssessment.financial_entity_id == org,
                        RiskAssessment.service_id == service_id,
                    )
                )
            )
        rows = self.db.execute(
            text(
                _LEGACY_SELECT
                + " WHERE financial_entity_id = :org AND service_id = :service_id"
            ),
            {"org": org, "service_id": service_id},
        ).all()
        return [_row_to_slice(r) for r in rows]

    def list_for_contract(self, org: UUID, contract_id: UUID) -> list[RiskAssessment | RiskGraphSlice]:
        if self.use_orm:
            return list(
                self.db.scalars(
                    select(RiskAssessment).where(
                        RiskAssessment.financial_entity_id == org,
                        RiskAssessment.contract_id == contract_id,
                    )
                )
            )
        rows = self.db.execute(
            text(
                _LEGACY_SELECT
                + " WHERE financial_entity_id = :org AND contract_id = :contract_id"
            ),
            {"org": org, "contract_id": contract_id},
        ).all()
        return [_row_to_slice(r) for r in rows]
