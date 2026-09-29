"""JWT-protected configuration API (dora_config layer)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.schemas_config import CustomFieldCreate, CustomFieldOut, CustomFieldPatch, ModuleOut
from app.core.database import get_db
from app.core.dependencies import AuthContext, get_auth_context, require_role
from app.core.rbac import Role
from app.models.platform_config import OrganizationModule, PlatformModule
from app.services.configuration_service import ConfigurationService

router = APIRouter(prefix="/config", tags=["Configuration"])


class SettingPatch(BaseModel):
    value: dict | None = None


class ModuleToggle(BaseModel):
    enabled: bool = True


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


@router.post("/modules/{module_key}", response_model=ModuleOut)
def upsert_module(
    module_key: str,
    body: ModuleToggle,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id, actor_id=str(ctx.user.id))
    module = service.set_module_enabled(module_key, body.enabled)
    return ModuleOut(
        key=module.key,
        name=module.name,
        description=module.description,
        enabled=body.enabled,
    )


@router.get("/custom-fields", response_model=list[CustomFieldOut])
def list_custom_fields(
    entity_type: str | None = Query(None),
    ctx: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id)
    return service.list_custom_fields(entity_type)


@router.post("/custom-fields", response_model=CustomFieldOut, status_code=status.HTTP_201_CREATED)
def create_custom_field(
    body: CustomFieldCreate,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id, actor_id=str(ctx.user.id))
    row = service.create_custom_field(body)
    db.flush()
    db.refresh(row)
    return row


@router.patch("/custom-fields/{field_id}", response_model=CustomFieldOut)
def patch_custom_field(
    field_id: UUID,
    body: CustomFieldPatch,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id, actor_id=str(ctx.user.id))
    row = service.patch_custom_field(field_id, body)
    db.flush()
    db.refresh(row)
    return row


@router.delete("/custom-fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_field(
    field_id: UUID,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id, actor_id=str(ctx.user.id))
    service.delete_custom_field(field_id)
    db.flush()


@router.get("/settings")
def get_settings(
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id)
    rows = service.get_settings()
    return {row.setting_key: row.value for row in rows}


@router.patch("/settings/{setting_key}")
def patch_setting(
    setting_key: str,
    body: SettingPatch,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    service = ConfigurationService(db, ctx.organization_id, actor_id=str(ctx.user.id))
    row = service.set_setting(setting_key, body.value)
    db.flush()
    return {"setting_key": row.setting_key, "value": row.value}
