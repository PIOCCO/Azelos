from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit import AuditRecord
from app.models.enums import AuditAction


def record_platform_audit(
    db: Session,
    *,
    organization_id: UUID | None,
    actor: str,
    entity_type: str,
    entity_id: UUID,
    action: AuditAction,
    new_value: dict | None = None,
    notes: str | None = None,
) -> AuditRecord:
    row = AuditRecord(
        financial_entity_id=organization_id,
        actor=actor,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        new_value=new_value,
        notes=notes,
    )
    db.add(row)
    return row
