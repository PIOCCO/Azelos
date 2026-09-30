from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.services.bia_service import BiaService

router = APIRouter(prefix="/bia", tags=["Business impact assessment"])


class BiaOut(BaseModel):
    id: UUID
    business_function_id: UUID
    rto_hours: int | None
    rpo_hours: int | None
    mtd_hours: int | None
    impact_summary: str | None
    review_owner: str | None
    last_reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class BiaCreate(BaseModel):
    business_function_id: UUID
    rto_hours: int | None = None
    rpo_hours: int | None = None
    mtd_hours: int | None = None
    impact_summary: str | None = None
    review_owner: str | None = None
    last_reviewed_at: datetime | None = None


class BiaUpdate(BaseModel):
    rto_hours: int | None = None
    rpo_hours: int | None = None
    mtd_hours: int | None = None
    impact_summary: str | None = None
    review_owner: str | None = None
    last_reviewed_at: datetime | None = None


@router.get("", response_model=list[BiaOut])
def list_bia(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return BiaService(db, ctx.organization_id).list_assessments()


@router.post("", response_model=BiaOut, status_code=201)
def create_bia(
    body: BiaCreate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = BiaService(db, ctx.organization_id).create(body.model_dump(), ctx.user.email)
    db.commit()
    return row


@router.patch("/{bia_id}", response_model=BiaOut)
def update_bia(
    bia_id: UUID,
    body: BiaUpdate,
    ctx: AuthContext = Depends(require_role(Role.BUSINESS_CONTINUITY_MANAGER)),
    db: Session = Depends(get_db),
):
    row = BiaService(db, ctx.organization_id).update(
        bia_id, body.model_dump(exclude_unset=True), ctx.user.email
    )
    db.commit()
    return row
