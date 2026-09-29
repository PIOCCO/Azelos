from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.org_context import organization_from_path
from app.core.rbac import Role
from app.schemas.profile import OrganizationProfileOut, OrganizationProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/organizations", tags=["Organization profile"])


@router.get("/{organization_id}/profile", response_model=OrganizationProfileOut)
def get_profile(
    organization_id: UUID,
    ctx: AuthContext = Depends(organization_from_path),
    db: Session = Depends(get_db),
):
    return ProfileService(db, organization_id).get_or_create()


@router.patch("/{organization_id}/profile", response_model=OrganizationProfileOut)
def patch_profile(
    organization_id: UUID,
    body: OrganizationProfileUpdate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    from app.core.org_context import assert_organization_access

    assert_organization_access(ctx, organization_id)
    profile = ProfileService(db, organization_id).update(body)
    db.flush()
    db.refresh(profile)
    return profile
