from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.common import PaginatedResponse
from app.schemas.contracts import ContractCreate, ContractOut, ContractUpdate
from app.models.enums import AuditAction
from app.services.contracts import ContractService
from app.services.platform_audit import record_platform_audit

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get("", response_model=PaginatedResponse)
def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    q: str | None = Query(None, max_length=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = ContractService(db, ctx.organization_id)
    items, total = service.list(page, page_size, q=q)
    return PaginatedResponse(
        items=[ContractOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(
    contract_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return ContractOut.model_validate(ContractService(db, ctx.organization_id).get(contract_id))


@router.post("", response_model=ContractOut, status_code=201)
def create_contract(
    body: ContractCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = ContractService(db, ctx.organization_id)
    row = service.create(body)
    db.flush()
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="Contract",
        entity_id=row.id,
        action=AuditAction.CREATE,
        new_value={"reference_number": body.reference_number},
    )
    db.refresh(row)
    return ContractOut.model_validate(row)


@router.patch("/{contract_id}", response_model=ContractOut)
def patch_contract(
    contract_id: UUID,
    body: ContractUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = ContractService(db, ctx.organization_id)
    row = service.update(contract_id, body)
    db.flush()
    db.refresh(row)
    return ContractOut.model_validate(row)
