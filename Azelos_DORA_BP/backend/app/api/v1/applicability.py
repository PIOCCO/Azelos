from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext
from app.core.org_context import organization_from_path
from app.core.rbac import Role, role_at_least
from app.schemas.applicability import ApplicabilityOut, ModuleApplicabilityOut
from app.services.applicability import ApplicabilityService
from app.services.configuration_service import ConfigurationService

router = APIRouter(prefix="/organizations", tags=["Applicability"])


class ModuleApplicabilityPatch(BaseModel):
    enabled: bool


@router.get("/{organization_id}/applicability", response_model=ApplicabilityOut)
def get_applicability(
    organization_id: UUID,
    ctx: AuthContext = Depends(organization_from_path),
    db: Session = Depends(get_db),
):
    return ApplicabilityService(db, organization_id).build_response()


@router.patch(
    "/{organization_id}/applicability/modules/{module_key}",
    response_model=ModuleApplicabilityOut,
)
def patch_applicability_module(
    organization_id: UUID,
    module_key: str,
    body: ModuleApplicabilityPatch,
    ctx: AuthContext = Depends(organization_from_path),
    db: Session = Depends(get_db),
):
    if not role_at_least(ctx.role, Role.ORG_ADMIN):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = ConfigurationService(db, organization_id, actor_id=str(ctx.user.id))
    service.set_module_enabled(module_key, body.enabled)
    db.flush()
    modules = ApplicabilityService(db, organization_id).build_response().modules
    module = next((m for m in modules if m.key == module_key), None)
    if module is None:
        raise HTTPException(status_code=404, detail="Unknown module")
    return module
