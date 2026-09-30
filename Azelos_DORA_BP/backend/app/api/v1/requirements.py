from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.org_context import organization_from_path
from app.core.rbac import Role
from app.schemas.requirements import (
    OrganizationRequirementDetailOut,
    OrganizationRequirementUpdate,
)
from app.services.requirement_service import RequirementService

router = APIRouter(prefix="/organizations", tags=["Organization requirements"])


@router.get(
    "/{organization_id}/requirements",
    response_model=list[OrganizationRequirementDetailOut],
)
def list_organization_requirements(
    organization_id: UUID,
    ctx: AuthContext = Depends(organization_from_path),
    db: Session = Depends(get_db),
):
    return RequirementService(db, organization_id).list_organization_status()


@router.patch(
    "/{organization_id}/requirements/{org_requirement_id}",
    response_model=OrganizationRequirementDetailOut,
)
def patch_organization_requirement(
    organization_id: UUID,
    org_requirement_id: UUID,
    body: OrganizationRequirementUpdate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    if organization_id != ctx.organization_id:
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Forbidden")
    out = RequirementService(db, organization_id).update_organization_requirement(
        org_requirement_id, body, ctx.user.email
    )
    db.commit()
    return out
