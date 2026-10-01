from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.business_function import BusinessFunction
from app.models.contract import Contract
from app.models.enums import AuditAction
from app.models.exit_strategy import ExitStrategy
from app.models.provider import ICTProvider
from app.models.service import ICTService
from app.schemas.exit_strategies import ExitStrategyCreate, ExitStrategyUpdate
from app.services.platform_audit import record_platform_audit


class ExitStrategyService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.db = db
        self.organization_id = organization_id

    def _assert_refs(self, data: ExitStrategyCreate) -> None:
        bf = self.db.get(BusinessFunction, data.business_function_id)
        if bf is None or bf.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Business function not found", 404)
        svc = self.db.get(ICTService, data.service_id)
        if svc is None or svc.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "ICT service not found", 404)
        contract = self.db.get(Contract, data.contract_id)
        if contract is None or contract.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Contract not found", 404)
        prov = self.db.get(ICTProvider, data.provider_id)
        if prov is None or prov.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Provider not found", 404)

    def list(self) -> list[ExitStrategy]:
        return list(
            self.db.scalars(
                select(ExitStrategy).where(
                    ExitStrategy.financial_entity_id == self.organization_id
                )
            ).all()
        )

    def create(self, data: ExitStrategyCreate, actor: str) -> ExitStrategy:
        self._assert_refs(data)
        row = ExitStrategy(financial_entity_id=self.organization_id, **data.model_dump())
        self.db.add(row)
        self.db.flush()
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="ExitStrategy",
            entity_id=row.id,
            action=AuditAction.CREATE,
        )
        return row

    def update(self, strategy_id: UUID, data: ExitStrategyUpdate, actor: str) -> ExitStrategy:
        row = self.db.scalar(
            select(ExitStrategy).where(
                ExitStrategy.id == strategy_id,
                ExitStrategy.financial_entity_id == self.organization_id,
            )
        )
        if row is None:
            raise AppError("NOT_FOUND", "Exit strategy not found", 404)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(row, key, val)
        record_platform_audit(
            self.db,
            organization_id=self.organization_id,
            actor=actor,
            entity_type="ExitStrategy",
            entity_id=row.id,
            action=AuditAction.UPDATE,
        )
        self.db.flush()
        return row
