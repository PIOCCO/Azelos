"""ICT third-party providers (DORA naming: ict-providers; legacy alias: suppliers)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.common import PaginatedResponse
from app.schemas.suppliers import SupplierCreate, SupplierOut, SupplierUpdate
from app.models.enums import AuditAction
from app.services.platform_audit import record_platform_audit
from app.services.suppliers import SupplierService

router = APIRouter(tags=["ICT Providers"])


def _paginated(service: SupplierService, page: int, page_size: int) -> PaginatedResponse:
    items, total = service.list(page, page_size)
    return PaginatedResponse(
        items=[SupplierOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/ict-providers", response_model=PaginatedResponse)
def list_providers(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return _paginated(SupplierService(db, ctx.organization_id), page, page_size)


@router.get("/ict-providers/{provider_id}", response_model=SupplierOut)
def get_provider(
    provider_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return SupplierOut.model_validate(SupplierService(db, ctx.organization_id).get(provider_id))


@router.post("/ict-providers", response_model=SupplierOut, status_code=201)
def create_provider(
    body: SupplierCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = SupplierService(db, ctx.organization_id)
    row = service.create(body)
    db.flush()
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="ICTProvider",
        entity_id=row.id,
        action=AuditAction.CREATE,
        new_value={"legal_name": body.legal_name},
    )
    db.flush()
    db.refresh(row)
    return SupplierOut.model_validate(row)


@router.patch("/ict-providers/{provider_id}", response_model=SupplierOut)
def patch_provider(
    provider_id: UUID,
    body: SupplierUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = SupplierService(db, ctx.organization_id)
    row = service.update(provider_id, body)
    db.flush()
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="ICTProvider",
        entity_id=row.id,
        action=AuditAction.UPDATE,
        new_value=body.model_dump(exclude_unset=True),
    )
    db.refresh(row)
    return SupplierOut.model_validate(row)


@router.get("/suppliers", response_model=PaginatedResponse, deprecated=True)
def list_suppliers_legacy(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return _paginated(SupplierService(db, ctx.organization_id), page, page_size)
