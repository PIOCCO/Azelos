from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.models.audit import AuditRecord
from app.models.enums import AuditAction
from app.schemas.common import PaginatedResponse
from pydantic import BaseModel

router = APIRouter(prefix="/audit-records", tags=["Audit"])


class AuditRecordOut(BaseModel):
    id: UUID
    financial_entity_id: UUID | None
    actor: str
    entity_type: str
    entity_id: UUID
    action: AuditAction
    old_value: dict | None
    new_value: dict | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=PaginatedResponse)
def list_audit_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    entity_type: str | None = None,
    action: AuditAction | None = None,
    actor: str | None = None,
    ctx: AuthContext = Depends(require_role(Role.AUDITOR)),
    db: Session = Depends(get_db),
):
    base = select(AuditRecord).where(AuditRecord.financial_entity_id == ctx.organization_id)
    if entity_type:
        base = base.where(AuditRecord.entity_type == entity_type)
    if action:
        base = base.where(AuditRecord.action == action)
    if actor:
        base = base.where(AuditRecord.actor.ilike(f"%{actor.strip()}%"))
    from sqlalchemy import func

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = db.scalars(
        base.order_by(AuditRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=[AuditRecordOut.model_validate(r) for r in rows],
        page=page,
        page_size=page_size,
        total=total,
    )
