from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.v1.org_context import assert_organization_access
from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.models.dora_baseline import OrganizationRequirement
from app.schemas.profile import ApplicabilityOut, OrganizationProfileOut, OrganizationProfileUpdate
from app.services.applicability import ApplicabilityService
from app.api.schemas_config import ModuleOut
from app.models.platform_config import OrganizationModule, PlatformModule
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/organizations", tags=["Organizations"])


class OrganizationRequirementOut(BaseModel):
    id: UUID
    dora_requirement_id: UUID
    applicable: bool
    implementation_status: str
    owner: str | None

    model_config = {"from_attributes": True}


@router.get("/{org_id}/profile", response_model=OrganizationProfileOut)
def get_organization_profile(
    org_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    assert_organization_access(ctx, org_id)
    profile = ProfileService(db, org_id).get_or_create()
    return profile


@router.patch("/{org_id}/profile", response_model=OrganizationProfileOut)
def patch_organization_profile(
    org_id: UUID,
    body: OrganizationProfileUpdate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    assert_organization_access(ctx, org_id)
    profile = ProfileService(db, org_id).update(body)
    db.flush()
    db.refresh(profile)
    return profile


@router.get("/{org_id}/applicability", response_model=ApplicabilityOut)
def get_applicability(
    org_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    assert_organization_access(ctx, org_id)
    result = ApplicabilityService(db, org_id).evaluate()
    return ApplicabilityOut(**result.to_dict())


@router.get("/{org_id}/modules", response_model=list[ModuleOut])
def list_organization_modules(
    org_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    assert_organization_access(ctx, org_id)
    modules = db.scalars(select(PlatformModule).order_by(PlatformModule.key)).all()
    enabled_ids = {
        row.platform_module_id
        for row in db.scalars(
            select(OrganizationModule).where(
                OrganizationModule.financial_entity_id == org_id,
                OrganizationModule.enabled.is_(True),
            )
        ).all()
    }
    return [
        ModuleOut(
            key=m.key,
            name=m.name,
            description=m.description,
            enabled=m.id in enabled_ids,
        )
        for m in modules
    ]


@router.get("/{org_id}/requirements", response_model=list[OrganizationRequirementOut])
def list_organization_requirements(
    org_id: UUID,
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    assert_organization_access(ctx, org_id)
    return db.scalars(
        select(OrganizationRequirement).where(
            OrganizationRequirement.financial_entity_id == org_id
        )
    ).all()
