from sqlalchemy.orm import Session

from app.models.entities import AuditAction, AuditLog


def log_audit(
    db: Session,
    action: AuditAction,
    *,
    tenant_id: str | None = None,
    user_id: str | None = None,
    request_id: str | None = None,
    resource_id: str | None = None,
    previous_state: str | None = None,
    new_state: str | None = None,
    result: str | None = None,
    detail: str | None = None,
) -> None:
    db.add(
        AuditLog(
            tenant_id=tenant_id,
            user_id=user_id,
            request_id=request_id,
            action=action,
            resource_id=resource_id,
            previous_state=previous_state,
            new_state=new_state,
            result=result,
            detail=detail,
        )
    )
    db.commit()
