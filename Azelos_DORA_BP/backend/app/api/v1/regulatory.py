from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_auth_context, AuthContext
from app.models.dora_baseline import DoraRequirement


class RegulatoryRequirementOut(BaseModel):
    id: UUID
    code: str
    title: str
    description: str | None

    model_config = {"from_attributes": True}


router = APIRouter(prefix="/regulatory-requirements", tags=["Regulatory baseline"])


@router.get("", response_model=list[RegulatoryRequirementOut], summary="Read-only baseline")
def list_requirements(
    _ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return db.scalars(select(DoraRequirement).order_by(DoraRequirement.code)).all()


@router.get("/{requirement_id}", response_model=RegulatoryRequirementOut)
def get_requirement(
    requirement_id: UUID,
    _ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    row = db.get(DoraRequirement, requirement_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return row
