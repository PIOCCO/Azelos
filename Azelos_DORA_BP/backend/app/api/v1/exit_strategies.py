from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.exit_strategies import ExitStrategyCreate, ExitStrategyOut, ExitStrategyUpdate
from app.services.exit_strategy_service import ExitStrategyService

router = APIRouter(prefix="/exit-strategies", tags=["Exit strategies"])


@router.get("", response_model=list[ExitStrategyOut])
def list_exit_strategies(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return ExitStrategyService(db, ctx.organization_id).list()


@router.post("", response_model=ExitStrategyOut, status_code=201)
def create_exit_strategy(
    body: ExitStrategyCreate,
    ctx: AuthContext = Depends(require_role(Role.RISK_MANAGER)),
    db: Session = Depends(get_db),
):
    row = ExitStrategyService(db, ctx.organization_id).create(body, ctx.user.email)
    db.commit()
    return row


@router.patch("/{strategy_id}", response_model=ExitStrategyOut)
def patch_exit_strategy(
    strategy_id: UUID,
    body: ExitStrategyUpdate,
    ctx: AuthContext = Depends(require_role(Role.RISK_MANAGER)),
    db: Session = Depends(get_db),
):
    row = ExitStrategyService(db, ctx.organization_id).update(
        strategy_id, body, ctx.user.email
    )
    db.commit()
    return row
