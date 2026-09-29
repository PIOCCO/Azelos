"""JWT-protected configuration API (dora_config layer)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.schemas_config import ModuleOut
from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.models.platform_config import OrganizationModule, PlatformModule

router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get("/modules", response_model=list[ModuleOut])
def list_modules(
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    modules = db.scalars(select(PlatformModule).order_by(PlatformModule.key)).all()
    enabled_ids = {
        row.platform_module_id
        for row in db.scalars(
            select(OrganizationModule).where(
                OrganizationModule.financial_entity_id == ctx.organization_id,
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


@router.get("/settings")
def get_settings_placeholder(
    _ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
):
    return {"message": "Use PATCH via legacy /api/config/settings until full v1 settings port"}
