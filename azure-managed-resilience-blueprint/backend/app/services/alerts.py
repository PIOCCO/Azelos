from sqlalchemy.orm import Session

from app.models.entities import Alert, AlertSeverity, AzureResource


def evaluate_alerts(db: Session, tenant_id: str, costs: dict) -> None:
    db.query(Alert).filter(Alert.tenant_id == tenant_id, Alert.active.is_(True)).update({"active": False})

    if costs.get("daily_today", 0) > costs.get("daily_yesterday", 0) * 2:
        db.add(
            Alert(
                tenant_id=tenant_id,
                severity=AlertSeverity.WARNING,
                title="Cost anomaly detected",
                message=f"Daily spend increased from ${costs.get('daily_yesterday')} to ${costs.get('daily_today')}. Likely cause: VM compute increase.",
                active=True,
            )
        )

    for r in db.query(AzureResource).filter(AzureResource.tenant_id == tenant_id).all():
        if r.backup_protected is False:
            db.add(
                Alert(
                    tenant_id=tenant_id,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Backup missing: {r.name}",
                    message="Resource is not protected by Azure Backup.",
                    active=True,
                )
            )
        if r.health_status == "critical":
            db.add(
                Alert(
                    tenant_id=tenant_id,
                    severity=AlertSeverity.WARNING,
                    title=f"High CPU: {r.name}",
                    message="Resource health indicates sustained high CPU.",
                    active=True,
                )
            )
    db.commit()
