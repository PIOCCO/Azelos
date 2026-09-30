from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.exceptions import AppError
from app.core.rbac import Role
from app.models.cloud_resilience import BusinessService, ResilienceAssessment, ServiceDependency
from app.schemas.cloud_resilience import (
    BusinessServiceCreate,
    BusinessServiceOut,
    BusinessServiceUpdate,
    ServiceDependencyCreate,
    ServiceDependencyOut,
)
from app.schemas.common import PaginatedResponse
from app.services.resilience_engine import rto_rpo_gap_minutes, run_service_assessment
from app.schemas.cloud_resilience import AssessmentOut, AssessmentControlOut

router = APIRouter(prefix="/business-services", tags=["Business Services"])


def _service_out(row: BusinessService) -> BusinessServiceOut:
    data = BusinessServiceOut.model_validate(row)
    data.rto_gap_minutes = rto_rpo_gap_minutes(row.rto_minutes, row.measured_recovery_minutes)
    data.rpo_gap_minutes = rto_rpo_gap_minutes(row.rpo_minutes, row.measured_data_loss_minutes)
    return data


def _get_service(db: Session, org_id: UUID, service_id: UUID) -> BusinessService:
    row = db.get(BusinessService, service_id)
    if row is None or row.financial_entity_id != org_id:
        raise AppError("NOT_FOUND", "Business service not found", 404)
    return row


@router.get("", response_model=PaginatedResponse)
def list_business_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    total = (
        db.scalar(
            select(func.count(BusinessService.id)).where(
                BusinessService.financial_entity_id == ctx.organization_id
            )
        )
        or 0
    )
    rows = db.scalars(
        select(BusinessService)
        .where(BusinessService.financial_entity_id == ctx.organization_id)
        .order_by(BusinessService.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[_service_out(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/{service_id}", response_model=BusinessServiceOut)
def get_business_service(
    service_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return _service_out(_get_service(db, ctx.organization_id, service_id))


@router.post("", response_model=BusinessServiceOut, status_code=201)
def create_business_service(
    body: BusinessServiceCreate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = BusinessService(financial_entity_id=ctx.organization_id, **body.model_dump())
    db.add(row)
    db.flush()
    db.refresh(row)
    return _service_out(row)


@router.patch("/{service_id}", response_model=BusinessServiceOut)
def update_business_service(
    service_id: UUID,
    body: BusinessServiceUpdate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = _get_service(db, ctx.organization_id, service_id)
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(row, key, val)
    db.flush()
    db.refresh(row)
    return _service_out(row)


@router.get("/{service_id}/dependencies", response_model=list[ServiceDependencyOut])
def list_dependencies(
    service_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    _get_service(db, ctx.organization_id, service_id)
    rows = db.scalars(
        select(ServiceDependency).where(
            ServiceDependency.business_service_id == service_id,
            ServiceDependency.financial_entity_id == ctx.organization_id,
        )
    ).all()
    return [ServiceDependencyOut.model_validate(r) for r in rows]


@router.post("/{service_id}/dependencies", response_model=ServiceDependencyOut, status_code=201)
def add_dependency(
    service_id: UUID,
    body: ServiceDependencyCreate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    _get_service(db, ctx.organization_id, service_id)
    row = ServiceDependency(
        financial_entity_id=ctx.organization_id,
        business_service_id=service_id,
        **body.model_dump(),
    )
    db.add(row)
    db.flush()
    db.refresh(row)
    return ServiceDependencyOut.model_validate(row)


@router.post("/{service_id}/assessments", response_model=AssessmentOut, status_code=201)
def run_assessment(
    service_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    _get_service(db, ctx.organization_id, service_id)
    created = run_service_assessment(
        db,
        organization_id=ctx.organization_id,
        business_service_id=service_id,
        assessed_by=ctx.user.email,
    )
    assessment = db.scalar(
        select(ResilienceAssessment)
        .options(selectinload(ResilienceAssessment.controls))
        .where(ResilienceAssessment.id == created.id)
    )
    out = AssessmentOut.model_validate(assessment)
    out.controls = [AssessmentControlOut.model_validate(c) for c in assessment.controls]
    return out
