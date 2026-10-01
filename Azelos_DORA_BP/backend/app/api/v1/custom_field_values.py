import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import AuthContext, require_role
from app.core.rbac import Role
from app.models.custom_fields import CustomFieldDefinition, CustomFieldValue
from app.services.custom_field_validation import (
    CustomFieldValidationError,
    assert_json_size,
    validate_value,
)

router = APIRouter(prefix="/custom-field-values", tags=["Custom field values"])


class CustomFieldValueIn(BaseModel):
    entity_type: str
    entity_id: uuid.UUID
    field_key: str
    value: object


@router.post("")
def upsert_custom_field_value(
    body: CustomFieldValueIn,
    ctx: AuthContext = Depends(require_role(Role.ORG_ADMIN)),
    db: Session = Depends(get_db),
):
    org_id = ctx.organization_id
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
                field_definition_id=definition.id,
                financial_entity_id=org_id,
                entity_type=body.entity_type,
                entity_id=body.entity_id,
                value=validated,
            )
        )
    db.commit()
    return {"ok": True}
