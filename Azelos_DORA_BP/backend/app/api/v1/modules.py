from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext
from app.core.org_context import organization_from_path
from app.schemas.applicability import ModuleApplicabilityOut
from app.services.module_service import ModuleService

router = APIRouter(prefix="/organizations", tags=["Modules"])


@router.get("/{organization_id}/modules", response_model=list[ModuleApplicabilityOut])
def list_modules(
    organization_id: UUID,
    ctx: AuthContext = Depends(organization_from_path),
    db: Session = Depends(get_db),
):
    return ModuleService(db, organization_id).list_for_organization()
