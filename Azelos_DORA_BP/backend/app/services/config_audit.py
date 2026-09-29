from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models.configuration_audit import ConfigurationAuditLog
from app.models.enums_config import ConfigAuditAction


def log_config_change(
    session: Session,
    *,
    financial_entity_id: uuid.UUID,
    actor_id: str,
    action: ConfigAuditAction,
    object_type: str,
    object_id: uuid.UUID,
    old_value: dict[str, Any] | None = None,
    new_value: dict[str, Any] | None = None,
) -> None:
    session.add(
        ConfigurationAuditLog(
            financial_entity_id=financial_entity_id,
            actor_id=actor_id,
            action=action,
            object_type=object_type,
            object_id=object_id,
            old_value=old_value,
            new_value=new_value,
        )
    )
