from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext
from app.core.org_context import organization_from_path
from app.schemas.applicability import ApplicabilityOut
from app.services.applicability import ApplicabilityService

router = APIRouter(prefix="/organizations", tags=["Applicability"])


@router.get("/{organization_id}/applicability", response_model=ApplicabilityOut)
def get_applicability(
    organization_id: UUID,
    ctx: AuthContext = Depends(organization_from_path),
    db: Session = Depends(get_db),
):
    return ApplicabilityService(db, organization_id).build_response()
