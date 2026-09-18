from sqlalchemy.orm import Session

from app.models.entities import AuditAction, AuditLog


def log_audit(
    db: Session,
    action: AuditAction,
    *,
    tenant_id: str | None = None,
    user_id: str | None = None,
    detail: str | None = None,
) -> None:
    db.add(
        AuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            detail=detail,
        )
    )
    db.commit()
