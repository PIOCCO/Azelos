from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.entities import Alert, AzureResource, CostSnapshot, DrSnapshot, MonthlyReport, Recommendation, SecurityFinding


def _latest_cost(db: Session, tenant_id: str) -> CostSnapshot | None:
    return (
        db.query(CostSnapshot)
        .filter(CostSnapshot.tenant_id == tenant_id)
        .order_by(CostSnapshot.captured_at.desc())
        .first()
    )


def _latest_dr(db: Session, tenant_id: str) -> DrSnapshot | None:
    return (
        db.query(DrSnapshot).filter(DrSnapshot.tenant_id == tenant_id).order_by(DrSnapshot.captured_at.desc()).first()
    )


def build_monthly_report_markdown(db: Session, tenant_id: str, tenant_name: str, period: str | None = None) -> str:
    period = period or datetime.now(timezone.utc).strftime("%Y-%m")
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all()
    protected = sum(1 for r in resources if r.backup_protected)
    coverage = int(100 * protected / len(resources)) if resources else 0
    cost = _latest_cost(db, tenant_id)
    dr = _latest_dr(db, tenant_id)
    sec = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tenant_id).all()
    high_sec = sum(1 for s in sec if s.severity in ("high", "critical"))
    alerts = db.query(Alert).filter(Alert.tenant_id == tenant_id, Alert.active.is_(True)).count()
    recs = db.query(Recommendation).filter(Recommendation.tenant_id == tenant_id).count()
    savings = sum(r.estimated_savings_usd or 0 for r in db.query(Recommendation).filter(Recommendation.tenant_id == tenant_id))

    from app.core.config import settings

    lines = [
        settings.product_name.upper(),
        "MONTHLY INFRASTRUCTURE REPORT",
        "",
        f"Customer: {tenant_name}",
        f"Period: {period}",
        "",
        f"Resources: {len(resources)}",
        f"Backup coverage: {coverage}%",
        f"Security findings (high/critical): {high_sec}",
        f"Azure spend (snapshot): ${cost.amount_usd if cost else 0:.0f}",
        f"Potential savings (recommendations): ${savings:.0f}/month",
        f"Active alerts: {alerts}",
        f"Recommendations tracked: {recs}",
        "",
        "Disaster Recovery",
        f"  Protected VMs: {dr.protected_vms if dr else 0}",
        f"  Healthy: {dr.healthy if dr else 0}",
        f"  Last DR test: {dr.last_dr_test if dr else 'n/a'}",
        "",
        "Outstanding risks",
    ]
    for r in resources:
        if r.backup_protected is False:
            lines.append(f"  - {r.name}: no backup protection")
        if r.health_status == "critical":
            lines.append(f"  - {r.name}: critical health (CPU/availability)")
    return "\n".join(lines)


def generate_monthly_report(db: Session, tenant_id: str, tenant_name: str) -> MonthlyReport:
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    body = build_monthly_report_markdown(db, tenant_id, tenant_name, period)
    report = MonthlyReport(tenant_id=tenant_id, period=period, body_markdown=body)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
