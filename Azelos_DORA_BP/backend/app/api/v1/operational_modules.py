"""BCP, DR, TLPT, resilience test campaigns."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.models.operational import (
    BusinessContinuityPlan,
    DisasterRecoveryPlan,
    ResilienceTestCampaign,
    TlptExercise,
)
from app.schemas.common import PaginatedResponse
from app.schemas.operational_entities import (
    BcpCreate,
    BcpOut,
    BcpUpdate,
    DrpCreate,
    DrpOut,
    DrpUpdate,
    ResilienceTestCreate,
    ResilienceTestOut,
    ResilienceTestUpdate,
    TlptCreate,
    TlptOut,
    TlptUpdate,
)
from app.services.operational_entities import bcp_service, drp_service, resilience_test_service, tlpt_service

router = APIRouter(tags=["Operational modules"])


def _actor(ctx: AuthContext) -> str:
    return ctx.user.email


@router.get("/resilience-tests", response_model=PaginatedResponse)
def list_resilience_tests(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    svc = resilience_test_service(db, ctx.organization_id)
    items, total = svc.list(page, page_size)
    return PaginatedResponse(
        items=[ResilienceTestOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/resilience-tests", response_model=ResilienceTestOut, status_code=201)
def create_resilience_test(
    body: ResilienceTestCreate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = ResilienceTestCampaign(**body.model_dump())
    svc = resilience_test_service(db, ctx.organization_id)
    svc.create(row, _actor(ctx))
    db.flush()
    return ResilienceTestOut.model_validate(row)


@router.patch("/resilience-tests/{test_id}", response_model=ResilienceTestOut)
def patch_resilience_test(
    test_id: UUID,
    body: ResilienceTestUpdate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    svc = resilience_test_service(db, ctx.organization_id)
    row = svc.update(test_id, body.model_dump(exclude_unset=True), _actor(ctx))
    return ResilienceTestOut.model_validate(row)


@router.get("/business-continuity", response_model=PaginatedResponse)
def list_bcp(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    svc = bcp_service(db, ctx.organization_id)
    items, total = svc.list(page, page_size)
    return PaginatedResponse(
        items=[BcpOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/business-continuity", response_model=BcpOut, status_code=201)
def create_bcp(
    body: BcpCreate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = BusinessContinuityPlan(**body.model_dump())
    bcp_service(db, ctx.organization_id).create(row, _actor(ctx))
    db.flush()
    return BcpOut.model_validate(row)


@router.patch("/business-continuity/{plan_id}", response_model=BcpOut)
def patch_bcp(
    plan_id: UUID,
    body: BcpUpdate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = bcp_service(db, ctx.organization_id).update(
        plan_id, body.model_dump(exclude_unset=True), _actor(ctx)
    )
    return BcpOut.model_validate(row)


@router.get("/disaster-recovery", response_model=PaginatedResponse)
def list_drp(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    svc = drp_service(db, ctx.organization_id)
    items, total = svc.list(page, page_size)
    return PaginatedResponse(
        items=[DrpOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/disaster-recovery", response_model=DrpOut, status_code=201)
def create_drp(
    body: DrpCreate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = DisasterRecoveryPlan(**body.model_dump())
    drp_service(db, ctx.organization_id).create(row, _actor(ctx))
    db.flush()
    return DrpOut.model_validate(row)


@router.patch("/disaster-recovery/{plan_id}", response_model=DrpOut)
def patch_drp(
    plan_id: UUID,
    body: DrpUpdate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = drp_service(db, ctx.organization_id).update(
        plan_id, body.model_dump(exclude_unset=True), _actor(ctx)
    )
    return DrpOut.model_validate(row)


@router.get("/tlpt", response_model=PaginatedResponse)
def list_tlpt(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    svc = tlpt_service(db, ctx.organization_id)
    items, total = svc.list(page, page_size)
    return PaginatedResponse(
        items=[TlptOut.model_validate(i) for i in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/tlpt", response_model=TlptOut, status_code=201)
def create_tlpt(
    body: TlptCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = TlptExercise(**body.model_dump())
    tlpt_service(db, ctx.organization_id).create(row, _actor(ctx))
    db.flush()
    return TlptOut.model_validate(row)


@router.patch("/tlpt/{exercise_id}", response_model=TlptOut)
def patch_tlpt(
    exercise_id: UUID,
    body: TlptUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = tlpt_service(db, ctx.organization_id).update(
        exercise_id, body.model_dump(exclude_unset=True), _actor(ctx)
    )
    return TlptOut.model_validate(row)
