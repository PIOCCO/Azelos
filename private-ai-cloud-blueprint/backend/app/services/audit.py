import json

from sqlalchemy.orm import Session

from app.models.entities import AuditAction, AuditLog


def log_audit(
    db: Session,
    *,
    tenant_id: str,
    user_id: str | None,
    action: AuditAction,
    resource_type: str | None = None,
    resource_id: str | None = None,
    metadata: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=json.dumps(metadata or {}),
        )
    )
    db.commit()
