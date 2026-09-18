import sys
from pathlib import Path

from sqlalchemy.orm import Session

# azure/collectors lives outside backend package
_ROOT = Path(__file__).resolve().parents[3]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from azure.collectors.sync import sync_tenant  # noqa: E402

from app.models.entities import AuditAction
from app.services.alerts import evaluate_alerts
from app.services.audit import log_audit
from app.services.recommendations import generate_recommendations


def run_full_sync(db: Session, tenant_id: str, user_id: str | None = None) -> dict:
    result = sync_tenant(db, tenant_id)
    log_audit(db, AuditAction.RESOURCE_DISCOVERED, tenant_id=tenant_id, user_id=user_id, detail=str(result))
    log_audit(db, AuditAction.BACKUP_CHECK, tenant_id=tenant_id, user_id=user_id)
    log_audit(db, AuditAction.DR_CHECK, tenant_id=tenant_id, user_id=user_id)
    log_audit(db, AuditAction.SECURITY_CHECK, tenant_id=tenant_id, user_id=user_id)
    log_audit(db, AuditAction.COST_CHECK, tenant_id=tenant_id, user_id=user_id)
    evaluate_alerts(db, tenant_id, result.get("costs", {}))
    recs = generate_recommendations(db, tenant_id)
    for _ in recs:
        log_audit(db, AuditAction.RECOMMENDATION_CREATED, tenant_id=tenant_id, user_id=user_id)
    return {**result, "recommendations_created": len(recs)}
