from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.common import PaginatedResponse
from app.schemas.ict_assets import (
    AssetFunctionMapCreate,
    AssetFunctionMapOut,
    ICTAssetCreate,
    ICTAssetOut,
    ICTAssetUpdate,
)
from app.services.ict_assets import ICTAssetService

router = APIRouter(tags=["ICT Assets"])


@router.get("/ict-assets", response_model=PaginatedResponse)
def list_ict_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = ICTAssetService(db, ctx.organization_id)
    items, total = service.list(page, page_size)
    return PaginatedResponse(
        items=[ICTAssetOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/ict-assets/{asset_id}", response_model=ICTAssetOut)
def get_ict_asset(
    asset_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = ICTAssetService(db, ctx.organization_id)
    return ICTAssetOut.model_validate(service.get(asset_id))


@router.post("/ict-assets", response_model=ICTAssetOut, status_code=201)
def create_ict_asset(
    body: ICTAssetCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = ICTAssetService(db, ctx.organization_id)
    row = service.create(body)
    db.flush()
    db.refresh(row)
    return ICTAssetOut.model_validate(row)


@router.patch("/ict-assets/{asset_id}", response_model=ICTAssetOut)
def update_ict_asset(
    asset_id: UUID,
    body: ICTAssetUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = ICTAssetService(db, ctx.organization_id)
    row = service.update(asset_id, body)
    db.flush()
    db.refresh(row)
    return ICTAssetOut.model_validate(row)


@router.post("/asset-function-maps", response_model=AssetFunctionMapOut, status_code=201)
def create_function_map(
    body: AssetFunctionMapCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = ICTAssetService(db, ctx.organization_id)
    row = service.map_to_function(body)
    db.flush()
    db.refresh(row)
    return AssetFunctionMapOut.model_validate(row)
