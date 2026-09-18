from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.entities import Alert, AlertCategory, AlertSeverity, AlertStatus, AzureResource


def evaluate_alerts(db: Session, tenant_id: str, costs: dict) -> None:
    db.query(Alert).filter(
        Alert.tenant_id == tenant_id,
        Alert.status.in_([AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED]),
    ).update({"status": AlertStatus.RESOLVED, "active": False, "resolved_at": datetime.now(timezone.utc)})

    if costs.get("daily_today", 0) > costs.get("daily_yesterday", 0) * 2 and costs.get("daily_yesterday"):
        db.add(
            Alert(
                tenant_id=tenant_id,
                severity=AlertSeverity.WARNING,
                category=AlertCategory.COST,
                title="Cost anomaly detected",
                message="Daily spend increased significantly compared to the previous day.",
                evidence=f"yesterday={costs.get('daily_yesterday')} today={costs.get('daily_today')}",
                status=AlertStatus.OPEN,
                active=True,
            )
        )

    for r in db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all():
        if r.backup_protected is False and "virtualMachines" in r.resource_type:
            db.add(
                Alert(
                    tenant_id=tenant_id,
                    severity=AlertSeverity.CRITICAL,
                    category=AlertCategory.BACKUP,
                    resource_id=r.id,
                    title=f"Backup missing: {r.name}",
                    message="Resource is not protected by Azure Backup.",
                    evidence=f"resource={r.azure_id}",
                    status=AlertStatus.OPEN,
                    active=True,
                )
            )
        if r.health_status == "critical":
            db.add(
                Alert(
                    tenant_id=tenant_id,
                    severity=AlertSeverity.WARNING,
                    category=AlertCategory.HEALTH,
                    resource_id=r.id,
                    title=f"High utilization: {r.name}",
                    message="Resource health indicates sustained high CPU or availability risk.",
                    evidence=f"health={r.health_status}",
                    status=AlertStatus.OPEN,
                    active=True,
                )
            )
    db.commit()
