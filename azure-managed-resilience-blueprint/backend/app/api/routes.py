from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles, resolve_tenant_id
from app.api.schemas import LoginRequest, RecommendationOut, ResourceOut, TenantOut, TokenResponse
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.entities import (
    Alert,
    AuditLog,
    AzureResource,
    CostSnapshot,
    DrSnapshot,
    Recommendation,
    RecommendationStatus,
    SecurityFinding,
    Tenant,
    User,
    UserRole,
)
from app.models.entities import AuditAction
from app.services.audit import log_audit
from app.services.reports import build_monthly_report_markdown, generate_monthly_report
from app.services.sync_pipeline import run_full_sync

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "env": settings.app_env, "azure_mock": settings.azure_mock}


@router.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id, {"role": user.role.value, "tenant_id": user.tenant_id})
    log_audit(db, AuditAction.USER_LOGIN, tenant_id=user.tenant_id, user_id=user.id, detail=user.email)
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
    tid = resolve_tenant_id(user, tenant_id or (user.tenant_id if user.tenant_id else "tenant-demo"))
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tid).all()
    healthy = sum(1 for r in resources if r.health_status == "healthy")
    warning = sum(1 for r in resources if r.health_status == "warning")
    critical = sum(1 for r in resources if r.health_status == "critical")
    protected = sum(1 for r in resources if r.backup_protected)
    coverage = int(100 * protected / len(resources)) if resources else 0
    sec = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tid).all()
    sec_counts = {}
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
        for r in db.query(Recommendation).filter(Recommendation.tenant_id == tid, Recommendation.status != RecommendationStatus.DISMISSED)
    )
    return {
        "tenant_id": tid,
        "resources_total": len(resources),
        "healthy": healthy,
        "warnings": warning,
        "critical": critical,
        "backup_coverage_pct": coverage,
        "security_findings": sec_counts,
        "monthly_cost_usd": cost.amount_usd if cost else None,
        "forecast_usd": cost.forecast_usd if cost else None,
        "budget_usd": cost.budget_usd if cost else settings.budget_usd,
        "potential_savings_usd": savings,
        "budget_thresholds": {
            "budget": settings.budget_usd,
            "warn": settings.budget_warn_usd,
            "critical": settings.budget_critical_usd,
            "emergency": settings.budget_emergency_usd,
        },
    }


@router.get("/resources", response_model=list[ResourceOut])
def list_resources(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
    return db.query(AzureResource).filter(AzureResource.tenant_id == tid).order_by(AzureResource.name).all()


@router.post("/sync")
def trigger_sync(
    tenant_id: str | None = Query(None),
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.OPERATOR, UserRole.CUSTOMER_ADMIN)),
    db: Session = Depends(get_db),
):
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
    return run_full_sync(db, tid, user.id)


@router.get("/backups")
def backup_status(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
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
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
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
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
    findings = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tid).all()
    return {"findings": [{"severity": f.severity, "title": f.title, "evidence": f.evidence} for f in findings]}


@router.get("/costs")
def costs(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
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
    return {
        "current_month_usd": snap.amount_usd if snap else 0,
        "forecast_usd": snap.forecast_usd if snap else None,
        "budget_usd": snap.budget_usd if snap else settings.budget_usd,
        "by_resource": by_resource,
    }


@router.get("/alerts")
def alerts(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
    rows = db.query(Alert).filter(Alert.tenant_id == tid, Alert.active.is_(True)).order_by(Alert.severity).all()
    return [{"id": a.id, "severity": a.severity.value, "title": a.title, "message": a.message} for a in rows]


@router.get("/recommendations", response_model=list[RecommendationOut])
def recommendations(
    tenant_id: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
    return db.query(Recommendation).filter(Recommendation.tenant_id == tid).order_by(Recommendation.priority).all()


@router.post("/recommendations/{rec_id}/approve")
def approve_recommendation(
    rec_id: str,
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.CUSTOMER_ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    rec = db.get(Recommendation, rec_id)
    if not rec:
        raise HTTPException(404, "Not found")
    resolve_tenant_id(user, rec.tenant_id)
    rec.status = RecommendationStatus.APPROVED
    db.commit()
    log_audit(
        db,
        AuditAction.RECOMMENDATION_APPROVED,
        tenant_id=rec.tenant_id,
        user_id=user.id,
        detail=rec.title,
    )
    return {"status": rec.status}


@router.post("/recommendations/{rec_id}/execute")
def execute_recommendation(
    rec_id: str,
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.CUSTOMER_ADMIN, UserRole.OPERATOR)),
    db: Session = Depends(get_db),
):
    rec = db.get(Recommendation, rec_id)
    if not rec:
        raise HTTPException(404, "Not found")
    resolve_tenant_id(user, rec.tenant_id)
    if rec.status != RecommendationStatus.APPROVED:
        raise HTTPException(400, "Recommendation must be approved before execution")
    rec.status = RecommendationStatus.EXECUTED
    db.commit()
    log_audit(
        db,
        AuditAction.ACTION_EXECUTED,
        tenant_id=rec.tenant_id,
        user_id=user.id,
        detail=f"{rec.title} | simulated runbook queued (no automatic production changes)",
    )
    return {"status": rec.status, "message": "Action recorded; execute via approved Azure runbook in production."}


@router.get("/reports/monthly")
def monthly_report(
    tenant_id: str | None = Query(None),
    format: str = Query("json"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
    tenant = db.get(Tenant, tid)
    name = tenant.name if tenant else tid
    if format == "markdown":
        return {"markdown": build_monthly_report_markdown(db, tid, name)}
    report = generate_monthly_report(db, tid, name)
    log_audit(db, AuditAction.REPORT_GENERATED, tenant_id=tid, user_id=user.id, detail=report.period)
    if format == "pdf":
        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        text = c.beginText(40, 750)
        for line in report.body_markdown.split("\n")[:45]:
            text.textLine(line[:100])
        c.drawText(text)
        c.showPage()
        c.save()
        buf.seek(0)
        return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=monthly-report.pdf"})
    return {"id": report.id, "period": report.period, "markdown": report.body_markdown}


@router.get("/audit-logs")
def audit_logs(
    tenant_id: str | None = Query(None),
    user: User = Depends(require_roles(UserRole.PROVIDER_ADMIN, UserRole.OPERATOR, UserRole.CUSTOMER_ADMIN)),
    db: Session = Depends(get_db),
):
    tid = resolve_tenant_id(user, tenant_id or user.tenant_id or "tenant-demo")
    logs = db.query(AuditLog).filter(AuditLog.tenant_id == tid).order_by(AuditLog.created_at.desc()).limit(100)
    return [
        {"action": l.action.value, "detail": l.detail, "user_id": l.user_id, "created_at": l.created_at.isoformat()}
        for l in logs
    ]
