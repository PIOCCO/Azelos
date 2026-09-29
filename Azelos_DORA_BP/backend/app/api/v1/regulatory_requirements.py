from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context
from app.schemas.requirements import RegulatoryRequirementOut
from app.services.requirement_service import RequirementService

router = APIRouter(prefix="/regulatory-requirements", tags=["Regulatory baseline"])


@router.get("", response_model=list[RegulatoryRequirementOut], summary="Read-only DORA baseline")
def list_regulatory_requirements(
    _ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return RequirementService(db).list_baseline()


@router.get("/{requirement_id}", response_model=RegulatoryRequirementOut)
def get_regulatory_requirement(
    requirement_id: UUID,
    _ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return RequirementService(db).get_baseline(requirement_id)
