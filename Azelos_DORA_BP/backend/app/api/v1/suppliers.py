from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.common import PaginatedResponse
from app.schemas.suppliers import SupplierCreate, SupplierOut, SupplierUpdate
from app.services.suppliers import SupplierService

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("", response_model=PaginatedResponse, summary="List ICT third-party providers")
def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = SupplierService(db, ctx.organization_id)
    items, total = service.list(page, page_size)
    return PaginatedResponse(
        items=[SupplierOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(
    supplier_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = SupplierService(db, ctx.organization_id)
    return SupplierOut.model_validate(service.get(supplier_id))


@router.post("", response_model=SupplierOut, status_code=201)
def create_supplier(
    body: SupplierCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = SupplierService(db, ctx.organization_id)
    row = service.create(body)
    db.flush()
    db.refresh(row)
    return SupplierOut.model_validate(row)


@router.patch("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: UUID,
    body: SupplierUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = SupplierService(db, ctx.organization_id)
    row = service.update(supplier_id, body)
    db.flush()
    db.refresh(row)
    return SupplierOut.model_validate(row)
