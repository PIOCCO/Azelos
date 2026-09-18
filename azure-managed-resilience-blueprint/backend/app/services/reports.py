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
    vms = [r for r in resources if "virtualMachines" in r.resource_type]
    protected = sum(1 for r in vms if r.backup_protected)
    coverage = int(100 * protected / len(vms)) if vms else 0
    cost = _latest_cost(db, tenant_id)
    dr = _latest_dr(db, tenant_id)
    sec = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tenant_id).all()
    high_sec = sum(1 for s in sec if s.severity in ("high", "critical"))
    alerts = db.query(Alert).filter(Alert.tenant_id == tenant_id).order_by(Alert.detected_at.desc()).limit(10).all()
    recs = db.query(Recommendation).filter(Recommendation.tenant_id == tenant_id).all()
    savings = sum(r.estimated_savings_usd or 0 for r in recs)

    from app.core.config import settings

    lines = [
        settings.product_name.upper(),
        "MONTHLY INFRASTRUCTURE REPORT",
        "",
        f"Customer: {tenant_name}",
        f"Period: {period}",
        f"Generated: {datetime.now(timezone.utc).date().isoformat()}",
        "",
        "EXECUTIVE SUMMARY",
        f"Resources monitored: {len(resources)}",
        f"Backup coverage (VMs): {coverage}%",
        f"Security findings (high/critical): {high_sec}",
        f"Cloud spend (snapshot): ${cost.amount_usd if cost else 0:.0f}",
        f"Potential savings: ${savings:.0f}/month",
        "",
        "INFRASTRUCTURE OVERVIEW",
    ]
    for r in resources[:15]:
        lines.append(f"  - {r.name} ({r.health_status})")
    lines.extend(
        [
            "",
            "RESILIENCE / BACKUP",
            f"Protected VMs: {protected} / {len(vms)}",
            "",
            "DISASTER RECOVERY",
            f"  Protected workloads: {dr.protected_vms if dr else 0}",
            f"  Healthy replications: {dr.healthy if dr else 0}",
            f"  Last DR test: {dr.last_dr_test if dr else 'Not recorded'}",
            "",
            "SECURITY",
        ]
    )
    for s in sec[:10]:
        lines.append(f"  - [{s.severity}] {s.title}")
    lines.extend(["", "FINOPS", f"  Budget: ${cost.budget_usd if cost and cost.budget_usd else 'n/a'}"])
    lines.extend(["", "ALERTS / INCIDENTS"])
    for a in alerts:
        lines.append(f"  - [{a.severity.value}] {a.title}")
    lines.extend(["", "RECOMMENDATIONS"])
    for r in recs[:10]:
        lines.append(f"  - [{r.priority}] {r.title}")
    lines.extend(["", "OUTSTANDING RISKS"])
    for r in resources:
        if r.backup_protected is False and "virtualMachines" in r.resource_type:
            lines.append(f"  - {r.name}: backup not configured")
        if r.health_status == "critical":
            lines.append(f"  - {r.name}: critical health signal")
    lines.extend(["", "NEXT REVIEW", "Schedule follow-up within 30 days."])
    return "\n".join(lines)


def report_pdf_sections(markdown: str) -> list[tuple[str, list[str]]]:
    sections: list[tuple[str, list[str]]] = []
    current_title = "Summary"
    current_lines: list[str] = []
    for line in markdown.split("\n"):
        if line.isupper() and len(line) > 3 and not line.startswith(" "):
            if current_lines:
                sections.append((current_title, current_lines))
            current_title = line.title()
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines:
        sections.append((current_title, current_lines))
    return sections


def generate_monthly_report(db: Session, tenant_id: str, tenant_name: str) -> MonthlyReport:
    period = datetime.now(timezone.utc).strftime("%Y-%m")
    body = build_monthly_report_markdown(db, tenant_id, tenant_name, period)
    report = MonthlyReport(tenant_id=tenant_id, period=period, body_markdown=body)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
