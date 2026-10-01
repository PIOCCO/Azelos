from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.common import PaginatedResponse
from app.schemas.risks import RiskCreate, RiskOut, RiskUpdate
from app.services.risks import RiskService

router = APIRouter(prefix="/risks", tags=["Risks"])


@router.get("", response_model=PaginatedResponse)
def list_risks(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    q: str | None = Query(None, max_length=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = RiskService(db, ctx.organization_id)
    items, total = service.list(page, page_size, q=q)
    return PaginatedResponse(
        items=[RiskOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{risk_id}", response_model=RiskOut)
def get_risk(
    risk_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = RiskService(db, ctx.organization_id)
    return RiskOut.model_validate(service.get(risk_id))


@router.post("", response_model=RiskOut, status_code=201)
def create_risk(
    body: RiskCreate,
    ctx: AuthContext = Depends(require_role(Role.RISK_MANAGER)),
    db: Session = Depends(get_db),
):
    service = RiskService(db, ctx.organization_id)
    row = service.create(body)
    db.flush()
    db.refresh(row)
    return RiskOut.model_validate(row)


@router.patch("/{risk_id}", response_model=RiskOut)
def patch_risk(
    risk_id: UUID,
    body: RiskUpdate,
    ctx: AuthContext = Depends(require_role(Role.RISK_MANAGER)),
    db: Session = Depends(get_db),
):
    service = RiskService(db, ctx.organization_id)
    row = service.update_lifecycle(risk_id, body, ctx.user.email)
    db.flush()
    return RiskOut.model_validate(row)
