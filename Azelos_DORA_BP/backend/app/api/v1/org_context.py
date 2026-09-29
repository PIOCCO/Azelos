from uuid import UUID

from fastapi import HTTPException

from app.core.dependencies import AuthContext
from app.core.rbac import Role


def assert_organization_access(ctx: AuthContext, org_id: UUID) -> None:
    if org_id != ctx.organization_id and ctx.role != Role.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")
