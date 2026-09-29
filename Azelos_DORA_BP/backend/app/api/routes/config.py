from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import (
    RequestContext,
    assert_org_path,
    get_db,
    get_request_context,
    require_admin,
)
from app.api.schemas_config import (
    CustomFieldCreate,
    CustomFieldOut,
    CustomFieldPatch,
    CustomFieldValueIn,
    ModuleOut,
)
from app.domain.entity_types import ALLOWED_ENTITY_TYPES
from app.models.custom_fields import CustomFieldDefinition, CustomFieldValue
from app.models.enums_config import ConfigAuditAction, CustomFieldType
from app.models.platform_config import OrganizationModule, PlatformModule
from app.services.config_audit import log_config_change
from app.services.custom_field_validation import (
    CustomFieldValidationError,
    assert_json_size,
    validate_entity_type,
    validate_field_key,
    validate_options_for_type,
    validate_value,
)

router = APIRouter(prefix="/api", tags=["configuration"])


@router.get("/config/modules", response_model=list[ModuleOut])
def list_modules_catalog(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
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


@router.get("/organizations/{org_id}/modules", response_model=list[ModuleOut])
def list_org_modules(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    assert_org_path(org_id, ctx)
    return list_modules_catalog(db=db, ctx=ctx)


@router.post("/organizations/{org_id}/modules/{module_key}/enable")
def enable_module(
    org_id: uuid.UUID,
    module_key: str,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    assert_org_path(org_id, ctx)
    require_admin(ctx)
    module = db.scalar(select(PlatformModule).where(PlatformModule.key == module_key))
    if module is None:
        raise HTTPException(status_code=404, detail="Unknown module")
    row = db.scalar(
        select(OrganizationModule).where(
            OrganizationModule.financial_entity_id == org_id,
            OrganizationModule.platform_module_id == module.id,
        )
    )
    if row is None:
        row = OrganizationModule(
            financial_entity_id=org_id,
            platform_module_id=module.id,
            enabled=True,
        )
        db.add(row)
    else:
        row.enabled = True
    log_config_change(
        db,
        financial_entity_id=org_id,
        actor_id=ctx.actor_id,
        action=ConfigAuditAction.MODULE_ENABLED,
        object_type="platform_module",
        object_id=module.id,
        new_value={"key": module_key},
    )
    db.commit()
    return {"status": "enabled", "module": module_key}


@router.post("/organizations/{org_id}/modules/{module_key}/disable")
def disable_module(
    org_id: uuid.UUID,
    module_key: str,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    assert_org_path(org_id, ctx)
    require_admin(ctx)
    module = db.scalar(select(PlatformModule).where(PlatformModule.key == module_key))
    if module is None:
        raise HTTPException(status_code=404, detail="Unknown module")
    row = db.scalar(
        select(OrganizationModule).where(
            OrganizationModule.financial_entity_id == org_id,
            OrganizationModule.platform_module_id == module.id,
        )
    )
    if row is None:
        row = OrganizationModule(
            financial_entity_id=org_id,
            platform_module_id=module.id,
            enabled=False,
        )
        db.add(row)
    else:
        row.enabled = False
    log_config_change(
        db,
        financial_entity_id=org_id,
        actor_id=ctx.actor_id,
        action=ConfigAuditAction.MODULE_DISABLED,
        object_type="platform_module",
        object_id=module.id,
        new_value={"key": module_key},
    )
    db.commit()
    return {"status": "disabled", "module": module_key}


@router.get("/organizations/{org_id}/custom-fields", response_model=list[CustomFieldOut])
def list_custom_fields(
    org_id: uuid.UUID,
    entity_type: str | None = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    assert_org_path(org_id, ctx)
    stmt = select(CustomFieldDefinition).where(
        CustomFieldDefinition.financial_entity_id == org_id,
        CustomFieldDefinition.active.is_(True),
        CustomFieldDefinition.deleted_at.is_(None),
    )
    if entity_type:
        validate_entity_type(entity_type)
        stmt = stmt.where(CustomFieldDefinition.entity_type == entity_type)
    rows = db.scalars(stmt.order_by(CustomFieldDefinition.display_order)).all()
    return rows


@router.post(
    "/organizations/{org_id}/custom-fields",
    response_model=CustomFieldOut,
    status_code=status.HTTP_201_CREATED,
)
def create_custom_field(
    org_id: uuid.UUID,
    body: CustomFieldCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    assert_org_path(org_id, ctx)
    require_admin(ctx)
    try:
        validate_entity_type(body.entity_type)
        validate_field_key(body.field_key)
        field_type = CustomFieldType(body.field_type)
        validate_options_for_type(field_type, body.options)
        assert_json_size(body.model_dump())
    except (CustomFieldValidationError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    row = CustomFieldDefinition(
        financial_entity_id=org_id,
        entity_type=body.entity_type,
        field_key=body.field_key,
        display_name=body.display_name,
        description=body.description,
        field_type=field_type,
        required=body.required,
        default_value=body.default_value,
        validation_rules=body.validation_rules,
        options=body.options,
        display_order=body.display_order,
    )
    db.add(row)
    db.flush()
    log_config_change(
        db,
        financial_entity_id=org_id,
        actor_id=ctx.actor_id,
        action=ConfigAuditAction.CUSTOM_FIELD_CREATED,
        object_type="custom_field_definition",
        object_id=row.id,
        new_value={"field_key": row.field_key, "entity_type": row.entity_type},
    )
    db.commit()
    db.refresh(row)
    return row


@router.patch("/organizations/{org_id}/custom-fields/{field_id}", response_model=CustomFieldOut)
def patch_custom_field(
    org_id: uuid.UUID,
    field_id: uuid.UUID,
    body: CustomFieldPatch,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    assert_org_path(org_id, ctx)
    require_admin(ctx)
    row = db.get(CustomFieldDefinition, field_id)
    if row is None or row.financial_entity_id != org_id:
        raise HTTPException(status_code=404, detail="Field not found")
    old = {"display_name": row.display_name, "active": row.active}
    data = body.model_dump(exclude_unset=True)
    if "active" in data and data["active"] is False:
        row.deleted_at = datetime.now(timezone.utc)
    for key, val in data.items():
        setattr(row, key, val)
    log_config_change(
        db,
        financial_entity_id=org_id,
        actor_id=ctx.actor_id,
        action=ConfigAuditAction.CUSTOM_FIELD_UPDATED
        if data.get("active") is not False
        else ConfigAuditAction.CUSTOM_FIELD_DISABLED,
        object_type="custom_field_definition",
        object_id=row.id,
        old_value=old,
        new_value=data,
    )
    db.commit()
    db.refresh(row)
    return row


@router.delete("/organizations/{org_id}/custom-fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_custom_field(
    org_id: uuid.UUID,
    field_id: uuid.UUID,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    assert_org_path(org_id, ctx)
    require_admin(ctx)
    row = db.get(CustomFieldDefinition, field_id)
    if row is None or row.financial_entity_id != org_id:
        raise HTTPException(status_code=404, detail="Field not found")
    row.active = False
    row.deleted_at = datetime.now(timezone.utc)
    log_config_change(
        db,
        financial_entity_id=org_id,
        actor_id=ctx.actor_id,
        action=ConfigAuditAction.CUSTOM_FIELD_DISABLED,
        object_type="custom_field_definition",
        object_id=row.id,
    )
    db.commit()


@router.post("/organizations/{org_id}/custom-field-values")
def upsert_custom_field_value(
    org_id: uuid.UUID,
    body: CustomFieldValueIn,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    assert_org_path(org_id, ctx)
    definition = db.scalar(
        select(CustomFieldDefinition).where(
            CustomFieldDefinition.financial_entity_id == org_id,
            CustomFieldDefinition.entity_type == body.entity_type,
            CustomFieldDefinition.field_key == body.field_key,
            CustomFieldDefinition.active.is_(True),
        )
    )
    if definition is None:
        raise HTTPException(status_code=404, detail="Custom field definition not found")
    try:
        validated = validate_value(
            definition.field_type,
            body.value,
            required=definition.required,
            options=definition.options,
        )
        assert_json_size(validated)
    except CustomFieldValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    existing = db.scalar(
        select(CustomFieldValue).where(
            CustomFieldValue.field_definition_id == definition.id,
            CustomFieldValue.entity_type == body.entity_type,
            CustomFieldValue.entity_id == body.entity_id,
        )
    )
    if existing:
        existing.value = validated
    else:
        db.add(
            CustomFieldValue(
                financial_entity_id=org_id,
                field_definition_id=definition.id,
                entity_type=body.entity_type,
                entity_id=body.entity_id,
                value=validated,
            )
        )
    db.commit()
    return {"status": "ok", "field_key": body.field_key}


@router.get("/meta/entity-types")
def list_entity_types():
    return {"entity_types": sorted(ALLOWED_ENTITY_TYPES)}
