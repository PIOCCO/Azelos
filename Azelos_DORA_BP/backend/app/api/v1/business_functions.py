from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.business_functions import (
    BusinessFunctionCreate,
    BusinessFunctionOut,
    BusinessFunctionUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services.business_functions import BusinessFunctionService

router = APIRouter(prefix="/business-functions", tags=["Business Functions"])


@router.get("", response_model=PaginatedResponse)
def list_business_functions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = BusinessFunctionService(db, ctx.organization_id)
    items, total = service.list(page, page_size)
    return PaginatedResponse(
        items=[BusinessFunctionOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{item_id}", response_model=BusinessFunctionOut)
def get_business_function(
    item_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = BusinessFunctionService(db, ctx.organization_id)
    return BusinessFunctionOut.model_validate(service.get(item_id))


@router.post("", response_model=BusinessFunctionOut, status_code=201)
def create_business_function(
    body: BusinessFunctionCreate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = BusinessFunctionService(db, ctx.organization_id)
    row = service.create(body)
    db.flush()
    db.refresh(row)
    return BusinessFunctionOut.model_validate(row)


@router.patch("/{item_id}", response_model=BusinessFunctionOut)
def patch_business_function(
    item_id: UUID,
    body: BusinessFunctionUpdate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = BusinessFunctionService(db, ctx.organization_id)
    row = service.update(item_id, body)
    db.flush()
    db.refresh(row)
    return BusinessFunctionOut.model_validate(row)


@router.delete("/{item_id}", status_code=204)
def delete_business_function(
    item_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = BusinessFunctionService(db, ctx.organization_id)
    service.delete(item_id)
    db.flush()
