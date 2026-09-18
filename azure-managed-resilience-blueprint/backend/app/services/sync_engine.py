import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.entities import AuditAction, SyncRun, SyncStatus, Tenant
from app.services.alerts import evaluate_alerts
from app.services.audit import log_audit
from app.services.recommendations import generate_recommendations
from azure.collectors.sync import sync_tenant


def _latest_running(db: Session, tenant_id: str) -> SyncRun | None:
    return (
        db.query(SyncRun)
        .filter(SyncRun.tenant_id == tenant_id, SyncRun.status == SyncStatus.RUNNING)
        .order_by(SyncRun.started_at.desc())
        .first()
    )


def run_full_sync(
    db: Session,
    tenant_id: str,
    *,
    user_id: str | None = None,
    request_id: str | None = None,
) -> dict:
    if _latest_running(db, tenant_id):
        raise AppError("Sync already running for this tenant", status_code=409, code="sync_in_progress")

    tenant = db.get(Tenant, tenant_id)
    subscription_id = (tenant.azure_subscription_id if tenant else None) or ""

    sync_run = SyncRun(tenant_id=tenant_id, status=SyncStatus.RUNNING)
    db.add(sync_run)
    db.commit()
    db.refresh(sync_run)

    log_audit(
        db,
        AuditAction.SYNC_STARTED,
        tenant_id=tenant_id,
        user_id=user_id,
        request_id=request_id,
        detail=sync_run.id,
    )

    try:
        result = sync_tenant(db, tenant_id, subscription_id)
        errors = result.get("errors") or []
        warnings = result.get("warnings") or []

        log_audit(db, AuditAction.RESOURCE_DISCOVERED, tenant_id=tenant_id, user_id=user_id, request_id=request_id)
        log_audit(db, AuditAction.BACKUP_CHECK, tenant_id=tenant_id, user_id=user_id, request_id=request_id)
        log_audit(db, AuditAction.DR_CHECK, tenant_id=tenant_id, user_id=user_id, request_id=request_id)
        log_audit(db, AuditAction.SECURITY_CHECK, tenant_id=tenant_id, user_id=user_id, request_id=request_id)
        log_audit(db, AuditAction.COST_CHECK, tenant_id=tenant_id, user_id=user_id, request_id=request_id)

        evaluate_alerts(db, tenant_id, result.get("costs", {}))
        recs = generate_recommendations(db, tenant_id)
        for _ in recs:
            log_audit(
                db,
                AuditAction.RECOMMENDATION_CREATED,
                tenant_id=tenant_id,
                user_id=user_id,
                request_id=request_id,
            )

        sync_run.resources_discovered = int(result.get("resources_synced", 0))
        sync_run.cost_records_processed = int(result.get("cost_records_processed", 0))
        sync_run.findings_generated = len(recs)
        sync_run.error_count = len(errors)
        sync_run.warning_count = len(warnings)
        sync_run.errors = json.dumps(errors) if errors else None
        sync_run.warnings = json.dumps(warnings) if warnings else None
        sync_run.completed_at = datetime.now(timezone.utc)
        sync_run.status = SyncStatus.PARTIAL if errors else SyncStatus.COMPLETED
        db.commit()

        log_audit(
            db,
            AuditAction.SYNC_COMPLETED,
            tenant_id=tenant_id,
            user_id=user_id,
            request_id=request_id,
            result=sync_run.status.value,
            detail=sync_run.id,
        )
        return {**result, "sync_id": sync_run.id, "sync_status": sync_run.status.value, "recommendations_created": len(recs)}
    except Exception as exc:  # noqa: BLE001
        sync_run.status = SyncStatus.FAILED
        sync_run.completed_at = datetime.now(timezone.utc)
        sync_run.errors = json.dumps([str(exc)])
        sync_run.error_count = 1
        db.commit()
        log_audit(
            db,
            AuditAction.SYNC_COMPLETED,
            tenant_id=tenant_id,
            user_id=user_id,
            request_id=request_id,
            result="failed",
            detail=str(exc),
        )
        raise AppError("Sync failed", status_code=502, code="sync_failed") from exc


def sync_status(db: Session, tenant_id: str) -> dict:
    last = (
        db.query(SyncRun).filter(SyncRun.tenant_id == tenant_id).order_by(SyncRun.started_at.desc()).first()
    )
    if not last:
        return {"last_status": None, "last_completed_at": None, "last_duration_seconds": None}
    duration = None
    if last.completed_at:
        duration = int((last.completed_at - last.started_at).total_seconds())
    return {
        "sync_id": last.id,
        "last_status": last.status.value,
        "last_started_at": last.started_at.isoformat(),
        "last_completed_at": last.completed_at.isoformat() if last.completed_at else None,
        "last_duration_seconds": duration,
        "resources_discovered": last.resources_discovered,
        "findings_generated": last.findings_generated,
        "error_count": last.error_count,
        "warning_count": last.warning_count,
    }
