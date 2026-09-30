from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.exceptions import AppError
from app.core.rbac import Role
from app.models.cloud_resilience import BusinessService, CloudResource
from app.schemas.cloud_resilience import CloudResourceLinkService, CloudResourceOut
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/cloud-resources", tags=["Cloud Environment"])


def _get_resource(db: Session, org_id: UUID, resource_id: UUID) -> CloudResource:
    row = db.get(CloudResource, resource_id)
    if row is None or row.financial_entity_id != org_id:
        raise AppError("NOT_FOUND", "Cloud resource not found", 404)
    return row


@router.get("", response_model=PaginatedResponse)
def list_cloud_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    cloud_account_id: UUID | None = None,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    base = select(CloudResource).where(
        CloudResource.financial_entity_id == ctx.organization_id
    )
    if cloud_account_id:
        base = base.where(CloudResource.cloud_account_id == cloud_account_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(CloudResource.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[CloudResourceOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.patch("/{resource_id}", response_model=CloudResourceOut)
def link_business_service(
    resource_id: UUID,
    body: CloudResourceLinkService,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = _get_resource(db, ctx.organization_id, resource_id)
    if body.business_service_id is not None:
        svc = db.get(BusinessService, body.business_service_id)
        if svc is None or svc.financial_entity_id != ctx.organization_id:
            raise AppError("NOT_FOUND", "Business service not found", 404)
    row.business_service_id = body.business_service_id
    db.flush()
    db.refresh(row)
    return CloudResourceOut.model_validate(row)
