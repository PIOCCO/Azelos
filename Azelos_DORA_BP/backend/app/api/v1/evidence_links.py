from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.services.evidence_link_service import EvidenceLinkService

router = APIRouter(prefix="/evidence-links", tags=["Evidence links"])


class ControlLinkIn(BaseModel):
    evidence_id: UUID
    contract_control_id: UUID


class RequirementLinkIn(BaseModel):
    evidence_id: UUID
    organization_requirement_id: UUID


class LinkOut(BaseModel):
    id: UUID


@router.post("/controls", response_model=LinkOut, status_code=201)
def link_evidence_control(
    body: ControlLinkIn,
    ctx: AuthContext = Depends(require_role(Role.SECURITY_MANAGER)),
    db: Session = Depends(get_db),
):
    link = EvidenceLinkService(db, ctx.organization_id).link_control(
        body.evidence_id, body.contract_control_id, ctx.user.email
    )
    db.commit()
    return LinkOut(id=link.id)


@router.post("/requirements", response_model=LinkOut, status_code=201)
def link_evidence_requirement(
    body: RequirementLinkIn,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    link = EvidenceLinkService(db, ctx.organization_id).link_requirement(
        body.evidence_id, body.organization_requirement_id, ctx.user.email
    )
    db.commit()
    return LinkOut(id=link.id)
