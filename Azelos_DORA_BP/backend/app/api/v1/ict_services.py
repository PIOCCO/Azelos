from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.schemas.common import PaginatedResponse
from app.schemas.ict_services import ICTServiceCreate, ICTServiceOut, ICTServiceUpdate
from app.services.evidence_enrich import ict_services_with_contract_evidence
from app.services.ict_service_domain import ICTServiceDomainService

router = APIRouter(prefix="/ict-services", tags=["ICT Services"])


@router.get("", response_model=PaginatedResponse)
def list_ict_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = ICTServiceDomainService(db, ctx.organization_id)
    items, total = service.list(page, page_size)
    enriched = ict_services_with_contract_evidence(db, ctx.organization_id, items)
    return PaginatedResponse(
        items=enriched,
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{service_id}", response_model=ICTServiceOut)
def get_ict_service(
    service_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    row = ICTServiceDomainService(db, ctx.organization_id).get(service_id)
    return ict_services_with_contract_evidence(db, ctx.organization_id, [row])[0]


@router.post("", response_model=ICTServiceOut, status_code=201)
def create_ict_service(
    body: ICTServiceCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = ICTServiceDomainService(db, ctx.organization_id)
    row = service.create(body)
    db.flush()
    db.refresh(row)
    return ICTServiceOut.model_validate(row)


@router.patch("/{service_id}", response_model=ICTServiceOut)
def patch_ict_service(
    service_id: UUID,
    body: ICTServiceUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    service = ICTServiceDomainService(db, ctx.organization_id)
    row = service.update(service_id, body)
    db.flush()
    db.refresh(row)
    return ICTServiceOut.model_validate(row)
