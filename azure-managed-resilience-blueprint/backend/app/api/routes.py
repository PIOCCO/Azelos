from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles, resolve_tenant_id
from app.api.schemas import LoginRequest, RecommendationOut, ResourceOut, TenantOut, TokenResponse
from app.auth.base import get_auth_provider
from app.core.config import settings
from app.core.constants import DEFAULT_TENANT_ID
from app.core.exceptions import AppError
from app.db.session import engine, get_db
from app.models.entities import (
    Alert,
    AlertStatus,
    AuditAction,
    AuditLog,
    AzureResource,
    CostSnapshot,
    DrSnapshot,
    Recommendation,
    RecommendationStatus,
    SecurityFinding,
    SyncRun,
    Tenant,
    User,
    UserRole,
)
from app.services.audit import log_audit
from app.services.reports import build_monthly_report_markdown, generate_monthly_report, report_pdf_sections
from app.services.reports_pdf import build_branded_pdf
from app.services.resilience_score import compute_resilience_score
from app.services.sync_engine import run_full_sync, sync_status

router = APIRouter()


def _tid(user: User, tenant_id: str | None) -> str:
    return resolve_tenant_id(user, tenant_id or user.tenant_id or DEFAULT_TENANT_ID)


def _rid(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


@router.get("/health")
def health():
    return {"status": "ok", "product": settings.product_name}


@router.get("/ready")
def ready():
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return {"status": "ready"}
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.get("/platform/meta")
def platform_meta():
    return {
        "product_name": settings.product_name,
        "demo_mode": settings.demo_mode,
        "auth_mode": settings.auth_mode,
        "environment": settings.environment,
        "sync_schedule_cron": settings.sync_schedule_cron,
    }


@router.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    if settings.is_production and settings.auth_mode.lower() != "entra":
        raise HTTPException(status_code=403, detail="Password login disabled in production.")
    provider = get_auth_provider()
    user = provider.authenticate(db, {"email": body.email, "password": body.password})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = provider.issue_token(user)
    log_audit(
        db,
        AuditAction.USER_LOGIN,
        tenant_id=user.tenant_id,
        user_id=user.id,
        request_id=_rid(request),
        detail=user.email,
        result="success",
    )
    return TokenResponse(access_token=token, role=user.role, tenant_id=user.tenant_id)


@router.get("/customers", response_model=list[TenantOut])
def list_customers(
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    return db.query(Tenant).order_by(Tenant.name).all()


@router.get("/dashboard/overview")
def dashboard_overview(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tid).all()
    healthy = sum(1 for r in resources if r.health_status == "healthy")
    warning = sum(1 for r in resources if r.health_status == "warning")
    critical = sum(1 for r in resources if r.health_status == "critical")
    vms = [r for r in resources if "virtualMachines" in r.resource_type]
    protected = sum(1 for r in vms if r.backup_protected)
    coverage = int(100 * protected / len(vms)) if vms else 0
    sec = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tid).all()
    sec_counts: dict[str, int] = {}
    for s in sec:
        sec_counts[s.severity] = sec_counts.get(s.severity, 0) + 1
    cost = (
        db.query(CostSnapshot)
        .filter(CostSnapshot.tenant_id == tid)
        .order_by(CostSnapshot.captured_at.desc())
        .first()
    )
    savings = sum(
        r.estimated_savings_usd or 0
        for r in db.query(Recommendation).filter(
            Recommendation.tenant_id == tid, Recommendation.status != RecommendationStatus.DISMISSED
        )
    )
    dr = (
        db.query(DrSnapshot).filter(DrSnapshot.tenant_id == tid).order_by(DrSnapshot.captured_at.desc()).first()
    )
    dr_ready = dr.healthy if dr else 0
    resilience = compute_resilience_score(db, tid)
    sync = sync_status(db, tid)
    budget = cost.budget_usd if cost and cost.budget_usd else settings.budget_usd
    spend = cost.amount_usd if cost else 0
    return {
        "tenant_id": tid,
        "resources_total": len(resources),
        "healthy": healthy,
        "warnings": warning,
        "critical": critical,
        "backup_coverage_pct": coverage,
        "dr_readiness": dr_ready,
        "security_findings": sec_counts,
        "monthly_cost_usd": spend,
        "forecast_usd": cost.forecast_usd if cost else None,
        "budget_usd": budget,
        "budget_utilization_pct": round(100 * spend / budget, 1) if budget else None,
        "potential_savings_usd": savings,
        "resilience": resilience,
        "sync": sync,
        "operational_issues": {
            "critical_alerts": resilience["open_critical_alerts"],
            "backup_gaps": len(vms) - protected,
            "security_high_critical": sum(sec_counts.get(k, 0) for k in ("high", "critical")),
        },
        "recent_alerts": [
            {"severity": a.severity.value, "title": a.title, "category": a.category.value}
            for a in db.query(Alert)
            .filter(Alert.tenant_id == tid)
            .order_by(Alert.detected_at.desc())
            .limit(5)
        ],
        "top_recommendations": [
            {"title": r.title, "priority": r.priority, "category": r.category.value, "status": r.status.value}
            for r in db.query(Recommendation)
            .filter(Recommendation.tenant_id == tid)
            .order_by(Recommendation.created_at.desc())
            .limit(5)
        ],
    }


@router.get("/resources", response_model=list[ResourceOut])
def list_resources(
    tenant_id: str | None = Query(None),
    search: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    q = db.query(AzureResource).filter(AzureResource.tenant_id == tid)
    if search:
        q = q.filter(AzureResource.name.ilike(f"%{search}%"))
    return q.order_by(AzureResource.name).all()


@router.post("/sync")
def trigger_sync(
    request: Request,
    tenant_id: str | None = Query(None),
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.OPERATOR, UserRole.CUSTOMER_ADMIN)),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    try:
        return run_full_sync(db, tid, user_id=user.id, request_id=_rid(request))
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/sync/status")
def get_sync_status(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return sync_status(db, _tid(user, tenant_id))


@router.get("/sync/history")
def sync_history(
    tenant_id: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    rows = (
        db.query(SyncRun).filter(SyncRun.tenant_id == tid).order_by(SyncRun.started_at.desc()).limit(limit).all()
    )
    return [
        {
            "id": r.id,
            "status": r.status.value,
            "started_at": r.started_at.isoformat(),
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "resources_discovered": r.resources_discovered,
            "findings_generated": r.findings_generated,
            "error_count": r.error_count,
        }
        for r in rows
    ]


@router.get("/backups")
def backup_status(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tid).all()
    vms = [r for r in resources if "virtualMachines" in r.resource_type]
    protected = sum(1 for r in vms if r.backup_protected)
    return {
        "coverage_pct": int(100 * protected / len(vms)) if vms else 0,
        "items": [
            {"name": r.name, "protected": bool(r.backup_protected), "last_backup_at": r.last_backup_at}
            for r in vms
        ],
    }


@router.get("/disaster-recovery")
def dr_status(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    dr = (
        db.query(DrSnapshot).filter(DrSnapshot.tenant_id == tid).order_by(DrSnapshot.captured_at.desc()).first()
    )
    if not dr:
        return {"protected_vms": 0, "healthy": 0, "warning": 0, "critical": 0, "last_dr_test": None}
    return {
        "protected_vms": dr.protected_vms,
        "healthy": dr.healthy,
        "warning": dr.warning,
        "critical": dr.critical,
        "last_dr_test": dr.last_dr_test,
    }


@router.get("/security")
def security_summary(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    findings = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tid).all()
    return {"findings": [{"severity": f.severity, "title": f.title, "evidence": f.evidence} for f in findings]}


@router.get("/costs")
def costs(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    snap = (
        db.query(CostSnapshot)
        .filter(CostSnapshot.tenant_id == tid)
        .order_by(CostSnapshot.captured_at.desc())
        .first()
    )
    by_resource = [
        {"name": r.name, "monthly_cost_usd": r.monthly_cost_usd}
        for r in db.query(AzureResource).filter(AzureResource.tenant_id == tid).all()
        if r.monthly_cost_usd
    ]
    budget = snap.budget_usd if snap and snap.budget_usd else settings.budget_usd
    current = snap.amount_usd if snap else 0
    return {
        "current_month_usd": current,
        "forecast_usd": snap.forecast_usd if snap else None,
        "budget_usd": budget,
        "budget_utilization_pct": round(100 * current / budget, 1) if budget else None,
        "by_resource": sorted(by_resource, key=lambda x: x["monthly_cost_usd"] or 0, reverse=True),
    }


@router.get("/alerts")
def list_alerts(
    tenant_id: str | None = Query(None),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    q = db.query(Alert).filter(Alert.tenant_id == tid)
    if status:
        q = q.filter(Alert.status == AlertStatus(status))
    else:
        q = q.filter(Alert.status != AlertStatus.RESOLVED)
    if severity:
        q = q.filter(Alert.severity == severity)
    rows = q.order_by(Alert.detected_at.desc()).all()
    return [
        {
            "id": a.id,
            "severity": a.severity.value,
            "category": a.category.value,
            "status": a.status.value,
            "title": a.title,
            "message": a.message,
            "evidence": a.evidence,
            "resource_id": a.resource_id,
            "detected_at": a.detected_at.isoformat(),
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
        }
        for a in rows
    ]


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    request: Request,
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.OPERATOR, UserRole.CUSTOMER_ADMIN)),
    db: Session = Depends(get_db),
):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(404, "Not found")
    resolve_tenant_id(user, alert.tenant_id)
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    log_audit(
        db,
        AuditAction.ALERT_ACKNOWLEDGED,
        tenant_id=alert.tenant_id,
        user_id=user.id,
        request_id=_rid(request),
        resource_id=alert.resource_id,
        new_state=alert.status.value,
    )
    return {"status": alert.status.value}


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    request: Request,
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.OPERATOR, UserRole.CUSTOMER_ADMIN)),
    db: Session = Depends(get_db),
):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(404, "Not found")
    resolve_tenant_id(user, alert.tenant_id)
    alert.status = AlertStatus.RESOLVED
    alert.active = False
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    log_audit(
        db,
        AuditAction.ALERT_RESOLVED,
        tenant_id=alert.tenant_id,
        user_id=user.id,
        request_id=_rid(request),
        resource_id=alert.resource_id,
        new_state=alert.status.value,
    )
    return {"status": alert.status.value}


@router.get("/recommendations", response_model=list[RecommendationOut])
def recommendations(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    return db.query(Recommendation).filter(Recommendation.tenant_id == tid).order_by(Recommendation.priority).all()


@router.post("/recommendations/{rec_id}/approve")
def approve_recommendation(
    rec_id: str,
    request: Request,
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.CUSTOMER_ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    rec = db.get(Recommendation, rec_id)
    if not rec:
        raise HTTPException(404, "Not found")
    resolve_tenant_id(user, rec.tenant_id)
    prev = rec.status.value
    rec.status = RecommendationStatus.APPROVED
    db.commit()
    log_audit(
        db,
        AuditAction.RECOMMENDATION_APPROVED,
        tenant_id=rec.tenant_id,
        user_id=user.id,
        request_id=_rid(request),
        resource_id=rec.resource_id,
        previous_state=prev,
        new_state=rec.status.value,
        detail=rec.title,
    )
    return {"status": rec.status}


@router.post("/recommendations/{rec_id}/execute")
def execute_recommendation(
    rec_id: str,
    request: Request,
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.CUSTOMER_ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    rec = db.get(Recommendation, rec_id)
    if not rec:
        raise HTTPException(404, "Not found")
    resolve_tenant_id(user, rec.tenant_id)
    if rec.status != RecommendationStatus.APPROVED:
        raise HTTPException(400, "Recommendation must be approved before execution")
    prev = rec.status.value
    rec.status = RecommendationStatus.EXECUTED
    db.commit()
    log_audit(
        db,
        AuditAction.ACTION_EXECUTED,
        tenant_id=rec.tenant_id,
        user_id=user.id,
        request_id=_rid(request),
        resource_id=rec.resource_id,
        previous_state=prev,
        new_state=rec.status.value,
        result="recorded",
        detail=f"{rec.title} — runbook queued (no automatic production changes)",
    )
    return {"status": rec.status, "message": "Action recorded; execute via approved Azure runbook in production."}


@router.get("/reports/monthly")
def monthly_report(
    request: Request,
    tenant_id: str | None = Query(None),
    format: str = Query("json"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    tenant = db.get(Tenant, tid)
    name = tenant.name if tenant else tid
    if format == "markdown":
        return {"markdown": build_monthly_report_markdown(db, tid, name)}
    report = generate_monthly_report(db, tid, name)
    log_audit(
        db,
        AuditAction.REPORT_GENERATED,
        tenant_id=tid,
        user_id=user.id,
        request_id=_rid(request) if request else None,
        detail=report.period,
    )
    if format == "pdf":
        sections = report_pdf_sections(report.body_markdown)
        pdf = build_branded_pdf(
            title=settings.product_name,
            customer=name,
            period=report.period,
            report_id=report.id,
            sections=sections,
        )
        return StreamingResponse(
            iter([pdf]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=atlas-monthly-report.pdf"},
        )
    return {"id": report.id, "period": report.period, "markdown": report.body_markdown}


@router.get("/audit-logs")
def audit_logs(
    tenant_id: str | None = Query(None),
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.OPERATOR, UserRole.CUSTOMER_ADMIN)),
    db: Session = Depends(get_db),
):
    tid = _tid(user, tenant_id)
    logs = db.query(AuditLog).filter(AuditLog.tenant_id == tid).order_by(AuditLog.created_at.desc()).limit(100)
    return [
        {
            "action": l.action.value,
            "detail": l.detail,
            "user_id": l.user_id,
            "request_id": l.request_id,
            "resource_id": l.resource_id,
            "previous_state": l.previous_state,
            "new_state": l.new_state,
            "result": l.result,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]
