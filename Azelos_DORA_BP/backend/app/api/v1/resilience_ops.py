from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.exceptions import AppError
from app.core.rbac import Role
from app.models.cloud_resilience import (
    BusinessService,
    BusinessServiceDoraLink,
    RecoveryTest,
    RemediationAction,
    ResilienceEvidenceItem,
    ResilienceFinding,
)
from app.models.enums import AuditAction
from app.models.enums_resilience import (
    FindingStatus,
    RemediationStatus,
)
from app.schemas.cloud_resilience import (
    BusinessServiceDoraLinkOut,
    BusinessServiceDoraLinkUpdate,
    RecoveryTestCreate,
    RecoveryTestOut,
    RemediationCreate,
    RemediationOut,
    RemediationUpdate,
    ResilienceDashboardOut,
    ResilienceEvidenceCreate,
    ResilienceEvidenceOut,
    ResilienceFindingCreate,
    ResilienceFindingOut,
    ResilienceFindingUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services.platform_audit import record_platform_audit
from app.services.recovery_test_calc import compute_recovery_outcome
from app.services.resilience_dashboard import build_dashboard

router = APIRouter(prefix="/resilience", tags=["Resilience"])


def _finding(db: Session, org_id: UUID, finding_id: UUID) -> ResilienceFinding:
    row = db.get(ResilienceFinding, finding_id)
    if row is None or row.financial_entity_id != org_id:
        raise AppError("NOT_FOUND", "Finding not found", 404)
    return row


@router.get("/dashboard", response_model=ResilienceDashboardOut)
def resilience_dashboard(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return build_dashboard(db, ctx.organization_id)


@router.get("/findings", response_model=PaginatedResponse)
def list_findings(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    org = ctx.organization_id
    total = (
        db.scalar(
            select(func.count(ResilienceFinding.id)).where(
                ResilienceFinding.financial_entity_id == org
            )
        )
        or 0
    )
    rows = db.scalars(
        select(ResilienceFinding)
        .where(ResilienceFinding.financial_entity_id == org)
        .order_by(ResilienceFinding.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[ResilienceFindingOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/findings", response_model=ResilienceFindingOut, status_code=201)
def create_finding(
    body: ResilienceFindingCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = ResilienceFinding(
        financial_entity_id=ctx.organization_id,
        created_by=ctx.user.email,
        **body.model_dump(),
    )
    db.add(row)
    db.flush()
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="resilience_finding",
        entity_id=row.id,
        action=AuditAction.FINDING_CREATE,
    )
    db.refresh(row)
    return ResilienceFindingOut.model_validate(row)


@router.patch("/findings/{finding_id}", response_model=ResilienceFindingOut)
def update_finding(
    finding_id: UUID,
    body: ResilienceFindingUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = _finding(db, ctx.organization_id, finding_id)
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(row, key, val)
    if body.status == FindingStatus.RESOLVED:
        row.resolved_at = datetime.now(timezone.utc)
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="resilience_finding",
        entity_id=row.id,
        action=AuditAction.FINDING_UPDATE,
    )
    db.flush()
    db.refresh(row)
    return ResilienceFindingOut.model_validate(row)


@router.get("/remediation", response_model=PaginatedResponse)
def list_remediation(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    org = ctx.organization_id
    total = (
        db.scalar(
            select(func.count(RemediationAction.id)).where(
                RemediationAction.financial_entity_id == org
            )
        )
        or 0
    )
    rows = db.scalars(
        select(RemediationAction)
        .where(RemediationAction.financial_entity_id == org)
        .order_by(RemediationAction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[RemediationOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/remediation", response_model=RemediationOut, status_code=201)
def create_remediation(
    body: RemediationCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    _finding(db, ctx.organization_id, body.finding_id)
    row = RemediationAction(
        financial_entity_id=ctx.organization_id,
        finding_id=body.finding_id,
        title=body.title,
        owner=body.owner,
        due_date=body.due_date,
    )
    db.add(row)
    db.flush()
    db.refresh(row)
    return RemediationOut.model_validate(row)


@router.patch("/remediation/{action_id}", response_model=RemediationOut)
def update_remediation(
    action_id: UUID,
    body: RemediationUpdate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = db.get(RemediationAction, action_id)
    if row is None or row.financial_entity_id != ctx.organization_id:
        raise AppError("NOT_FOUND", "Remediation action not found", 404)
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(row, key, val)
    if body.status == RemediationStatus.RESOLVED and body.verification_notes:
        row.verified_at = datetime.now(timezone.utc)
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="remediation_action",
        entity_id=row.id,
        action=AuditAction.REMEDIATION_UPDATE,
    )
    db.flush()
    db.refresh(row)
    return RemediationOut.model_validate(row)


@router.get("/evidence", response_model=PaginatedResponse)
def list_resilience_evidence(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    org = ctx.organization_id
    total = (
        db.scalar(
            select(func.count(ResilienceEvidenceItem.id)).where(
                ResilienceEvidenceItem.financial_entity_id == org
            )
        )
        or 0
    )
    rows = db.scalars(
        select(ResilienceEvidenceItem)
        .where(ResilienceEvidenceItem.financial_entity_id == org)
        .order_by(ResilienceEvidenceItem.collected_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[ResilienceEvidenceOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/evidence", response_model=ResilienceEvidenceOut, status_code=201)
def create_resilience_evidence(
    body: ResilienceEvidenceCreate,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    payload = body.model_dump()
    metadata = payload.pop("metadata", None)
    row = ResilienceEvidenceItem(
        financial_entity_id=ctx.organization_id,
        collected_by=ctx.user.email,
        metadata_=metadata,
        **payload,
    )
    db.add(row)
    db.flush()
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="resilience_evidence",
        entity_id=row.id,
        action=AuditAction.EVIDENCE_UPLOAD,
    )
    db.refresh(row)
    return ResilienceEvidenceOut.model_validate(row)


@router.get("/recovery-tests", response_model=PaginatedResponse)
def list_recovery_tests(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    org = ctx.organization_id
    total = (
        db.scalar(
            select(func.count(RecoveryTest.id)).where(RecoveryTest.financial_entity_id == org)
        )
        or 0
    )
    rows = db.scalars(
        select(RecoveryTest)
        .where(RecoveryTest.financial_entity_id == org)
        .order_by(RecoveryTest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[RecoveryTestOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.post("/recovery-tests", response_model=RecoveryTestOut, status_code=201)
def create_recovery_test(
    body: RecoveryTestCreate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    svc = db.get(BusinessService, body.business_service_id)
    if svc is None or svc.financial_entity_id != ctx.organization_id:
        raise AppError("NOT_FOUND", "Business service not found", 404)
    outcome = compute_recovery_outcome(
        target_rto_minutes=body.target_rto_minutes,
        target_rpo_minutes=body.target_rpo_minutes,
        actual_recovery_minutes=body.actual_recovery_minutes,
        actual_data_loss_minutes=body.actual_data_loss_minutes,
    )
    row = RecoveryTest(
        financial_entity_id=ctx.organization_id,
        created_by=ctx.user.email,
        outcome=outcome,
        **body.model_dump(),
    )
    db.add(row)
    if body.actual_recovery_minutes is not None:
        svc.measured_recovery_minutes = body.actual_recovery_minutes
    if body.actual_data_loss_minutes is not None:
        svc.measured_data_loss_minutes = body.actual_data_loss_minutes
    if body.executed_at:
        svc.last_recovery_test_at = body.executed_at
    db.flush()
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="recovery_test",
        entity_id=row.id,
        action=AuditAction.RECOVERY_TEST_CREATE,
    )
    db.refresh(row)
    return RecoveryTestOut.model_validate(row)


@router.get("/dora-links", response_model=PaginatedResponse)
def list_dora_links(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    org = ctx.organization_id
    total = (
        db.scalar(
            select(func.count(BusinessServiceDoraLink.id)).where(
                BusinessServiceDoraLink.financial_entity_id == org
            )
        )
        or 0
    )
    rows = db.scalars(
        select(BusinessServiceDoraLink)
        .where(BusinessServiceDoraLink.financial_entity_id == org)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[BusinessServiceDoraLinkOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.patch("/dora-links/{link_id}", response_model=BusinessServiceDoraLinkOut)
def update_dora_link(
    link_id: UUID,
    body: BusinessServiceDoraLinkUpdate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    row = db.get(BusinessServiceDoraLink, link_id)
    if row is None or row.financial_entity_id != ctx.organization_id:
        raise AppError("NOT_FOUND", "DORA link not found", 404)
    row.implementation_status = body.implementation_status
    row.owner = body.owner
    row.next_review_at = body.next_review_at
    row.last_assessed_at = datetime.now(timezone.utc)
    db.flush()
    db.refresh(row)
    return BusinessServiceDoraLinkOut.model_validate(row)


@router.get("/reports/{report_type}")
def generate_report(
    report_type: str,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    allowed = {
        "business-resilience",
        "dora-assessment",
        "cloud-gap",
        "remediation",
        "recovery-testing",
    }
    if report_type not in allowed:
        raise AppError("NOT_FOUND", "Unknown report type", 404)
    dash = build_dashboard(db, ctx.organization_id)
    record_platform_audit(
        db,
        organization_id=ctx.organization_id,
        actor=ctx.user.email,
        entity_type="report",
        entity_id=ctx.organization_id,
        action=AuditAction.REPORT_GENERATE,
        new_value={"report_type": report_type},
    )
    db.flush()
    return {
        "report_type": report_type,
        "disclaimer": "Observed evidence and assessments only — not a compliance certification.",
        "dashboard": dash.model_dump(),
        "methodology": "Aggregates stored findings, tests, and DORA link statuses for this organization.",
    }
