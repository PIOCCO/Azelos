from uuid import UUID

from fastapi import Depends, HTTPException, Path

from app.core.dependencies import AuthContext, get_auth_context
from app.core.rbac import Role


def assert_organization_access(ctx: AuthContext, organization_id: UUID) -> None:
    if organization_id != ctx.organization_id and ctx.role != Role.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")


def organization_from_path(
    organization_id: UUID = Path(..., description="Organization UUID"),
    ctx: AuthContext = Depends(get_auth_context),
) -> AuthContext:
    """Validate URL organization_id against JWT membership."""
    assert_organization_access(ctx, organization_id)
    return ctx
