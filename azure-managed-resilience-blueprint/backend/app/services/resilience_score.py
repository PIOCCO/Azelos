from sqlalchemy.orm import Session

from app.models.entities import Alert, AlertSeverity, AlertStatus, AzureResource, DrSnapshot, SecurityFinding


def compute_resilience_score(db: Session, tenant_id: str) -> dict:
    resources = db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all()
    vms = [r for r in resources if "virtualMachines" in r.resource_type]
    protected = sum(1 for r in vms if r.backup_protected)
    backup_coverage = (protected / len(vms)) if vms else 1.0

    fresh = sum(1 for r in vms if r.last_backup_at is not None)
    backup_freshness = (fresh / len(vms)) if vms else 0.5

    dr = (
        db.query(DrSnapshot).filter(DrSnapshot.tenant_id == tenant_id).order_by(DrSnapshot.captured_at.desc()).first()
    )
    dr_coverage = 0.0
    dr_health = 0.0
    if dr and dr.protected_vms:
        dr_coverage = min(1.0, dr.protected_vms / max(len(vms), 1))
        dr_health = dr.healthy / max(dr.protected_vms, 1)

    sec = db.query(SecurityFinding).filter(SecurityFinding.tenant_id == tenant_id).all()
    crit_high = sum(1 for s in sec if s.severity in ("critical", "high"))
    security_posture = max(0.0, 1.0 - min(1.0, crit_high / 10.0))

    monitored = sum(1 for r in resources if r.health_status != "unknown")
    monitoring_coverage = (monitored / len(resources)) if resources else 0.0

    weights = {
        "backup_coverage": 25,
        "backup_freshness": 15,
        "dr_coverage": 20,
        "dr_replication_health": 15,
        "security_posture": 15,
        "monitoring_coverage": 10,
    }
    factors = {
        "backup_coverage": backup_coverage,
        "backup_freshness": backup_freshness,
        "dr_coverage": dr_coverage,
        "dr_replication_health": dr_health,
        "security_posture": security_posture,
        "monitoring_coverage": monitoring_coverage,
    }
    score = sum(weights[k] * factors[k] for k in weights)
    open_critical = (
        db.query(Alert)
        .filter(Alert.tenant_id == tenant_id, Alert.status == AlertStatus.OPEN, Alert.severity == AlertSeverity.CRITICAL)
        .count()
    )
    return {
        "score": int(round(score)),
        "max_score": 100,
        "weights": weights,
        "factors": {k: round(v * 100, 1) for k, v in factors.items()},
        "open_critical_alerts": open_critical,
    }
