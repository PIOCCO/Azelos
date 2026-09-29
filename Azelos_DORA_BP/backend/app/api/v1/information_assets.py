from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.common import PaginatedResponse
from app.schemas.information_assets import InformationAssetCreate, InformationAssetOut
from app.services.information_assets import InformationAssetService

router = APIRouter(prefix="/information-assets", tags=["Information assets"])


@router.get("", response_model=PaginatedResponse)
def list_information_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = InformationAssetService(db, ctx.organization_id)
    items, total = service.list(page, page_size)
    return PaginatedResponse(
        items=[InformationAssetOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("", response_model=InformationAssetOut, status_code=201)
def create_information_asset(
    body: InformationAssetCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = InformationAssetService(db, ctx.organization_id)
    row = service.create(body)
    db.flush()
    db.refresh(row)
    return InformationAssetOut.model_validate(row)
