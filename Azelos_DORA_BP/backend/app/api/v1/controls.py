from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context
from app.models.dora_control import ContractDoraControl, DoraControlDefinition

router = APIRouter(prefix="/controls", tags=["Controls"])


class ControlDefinitionOut(BaseModel):
    id: UUID
    code: str
    name: str
    category: str
    description: str | None

    model_config = {"from_attributes": True}


class ContractControlOut(BaseModel):
    id: UUID
    contract_id: UUID
    control_definition_id: UUID
    compliance_status: str

    model_config = {"from_attributes": True}


@router.get("/definitions", response_model=list[ControlDefinitionOut], summary="Catalogue (read-only)")
def list_control_definitions(
    _ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return db.scalars(select(DoraControlDefinition).order_by(DoraControlDefinition.code)).all()


@router.get("/definitions/{definition_id}", response_model=ControlDefinitionOut)
def get_control_definition(
    definition_id: UUID,
    _ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    row = db.get(DoraControlDefinition, definition_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.get("", response_model=list[ContractControlOut], summary="Organization contract controls")
def list_contract_controls(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(ContractDoraControl).where(
            ContractDoraControl.financial_entity_id == ctx.organization_id
        )
    ).all()
