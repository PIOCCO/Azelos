from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext
from app.core.org_context import organization_from_path
from app.schemas.requirements import OrganizationRequirementDetailOut
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
