from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.schemas_config import CustomFieldCreate, CustomFieldPatch
from app.core.exceptions import AppError
from app.domain.entity_types import ALLOWED_ENTITY_TYPES
from app.models.custom_fields import CustomFieldDefinition
from app.models.enums_config import ConfigAuditAction, CustomFieldType
from app.models.platform_config import OrganizationModule, OrganizationSetting, PlatformModule
from app.services.applicability import ApplicabilityService
from app.services.config_audit import log_config_change
from app.services.custom_field_validation import (
    CustomFieldValidationError,
    assert_json_size,
    validate_entity_type,
    validate_field_key,
    validate_options_for_type,
)


class ConfigurationService:
    def __init__(self, db: Session, organization_id: UUID, actor_id: str = "api") -> None:
        self.db = db
        self.organization_id = organization_id
        self.actor_id = actor_id

    def list_custom_fields(self, entity_type: str | None = None) -> list[CustomFieldDefinition]:
        stmt = select(CustomFieldDefinition).where(
            CustomFieldDefinition.financial_entity_id == self.organization_id,
            CustomFieldDefinition.active.is_(True),
            CustomFieldDefinition.deleted_at.is_(None),
        )
        if entity_type:
            validate_entity_type(entity_type)
            stmt = stmt.where(CustomFieldDefinition.entity_type == entity_type)
        return list(self.db.scalars(stmt.order_by(CustomFieldDefinition.display_order)).all())

    def create_custom_field(self, body: CustomFieldCreate) -> CustomFieldDefinition:
        try:
            validate_entity_type(body.entity_type)
            validate_field_key(body.field_key)
            field_type = CustomFieldType(body.field_type)
            validate_options_for_type(field_type, body.options)
            assert_json_size(body.model_dump())
        except (CustomFieldValidationError, ValueError) as exc:
            raise AppError("VALIDATION_ERROR", str(exc), 400) from exc
        row = CustomFieldDefinition(
            financial_entity_id=self.organization_id,
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
        self.db.add(row)
        self.db.flush()
        log_config_change(
            self.db,
            financial_entity_id=self.organization_id,
            actor_id=self.actor_id,
            action=ConfigAuditAction.CUSTOM_FIELD_CREATED,
            object_type="custom_field_definition",
            object_id=row.id,
            new_value={"field_key": row.field_key, "entity_type": row.entity_type},
        )
        return row

    def patch_custom_field(self, field_id: UUID, body: CustomFieldPatch) -> CustomFieldDefinition:
        row = self.db.get(CustomFieldDefinition, field_id)
        if row is None or row.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Field not found", 404)
        data = body.model_dump(exclude_unset=True)
        if data.get("active") is False:
            row.deleted_at = datetime.now(timezone.utc)
        for key, val in data.items():
            setattr(row, key, val)
        log_config_change(
            self.db,
            financial_entity_id=self.organization_id,
            actor_id=self.actor_id,
            action=ConfigAuditAction.CUSTOM_FIELD_UPDATED,
            object_type="custom_field_definition",
            object_id=row.id,
            new_value=data,
        )
        return row

    def delete_custom_field(self, field_id: UUID) -> None:
        row = self.db.get(CustomFieldDefinition, field_id)
        if row is None or row.financial_entity_id != self.organization_id:
            raise AppError("NOT_FOUND", "Field not found", 404)
        row.active = False
        row.deleted_at = datetime.now(timezone.utc)
        log_config_change(
            self.db,
            financial_entity_id=self.organization_id,
            actor_id=self.actor_id,
            action=ConfigAuditAction.CUSTOM_FIELD_DISABLED,
            object_type="custom_field_definition",
            object_id=row.id,
        )

    def get_settings(self) -> list[OrganizationSetting]:
        return list(
            self.db.scalars(
                select(OrganizationSetting).where(
                    OrganizationSetting.financial_entity_id == self.organization_id
                )
            ).all()
        )

    def set_setting(self, key: str, value: dict | None) -> OrganizationSetting:
        row = self.db.scalar(
            select(OrganizationSetting).where(
                OrganizationSetting.financial_entity_id == self.organization_id,
                OrganizationSetting.setting_key == key,
            )
        )
        if row is None:
            row = OrganizationSetting(
                financial_entity_id=self.organization_id,
                setting_key=key,
                value=value,
            )
            self.db.add(row)
        else:
            row.value = value
        self.db.flush()
        return row

    def set_module_enabled(self, module_key: str, enabled: bool) -> PlatformModule:
        module = self.db.scalar(select(PlatformModule).where(PlatformModule.key == module_key))
        if module is None:
            raise AppError("NOT_FOUND", "Unknown module", 404)

        applicability = ApplicabilityService(self.db, self.organization_id)
        rule_required = applicability.module_required_by_rules(module_key)
        if not enabled and rule_required:
            raise AppError(
                "MODULE_REQUIRED",
                "This module is required by applicability rules and cannot be disabled",
                403,
            )

        row = self.db.scalar(
            select(OrganizationModule).where(
                OrganizationModule.financial_entity_id == self.organization_id,
                OrganizationModule.platform_module_id == module.id,
            )
        )
        previous_enabled = row.enabled if row is not None else None
        if row is None:
            row = OrganizationModule(
                financial_entity_id=self.organization_id,
                platform_module_id=module.id,
                enabled=enabled,
            )
            self.db.add(row)
        else:
            row.enabled = enabled
        self.db.flush()
        log_config_change(
            self.db,
            financial_entity_id=self.organization_id,
            actor_id=self.actor_id,
            action=ConfigAuditAction.MODULE_ENABLED
            if enabled
            else ConfigAuditAction.MODULE_DISABLED,
            object_type="platform_module",
            object_id=module.id,
            old_value={
                "key": module_key,
                "enabled": previous_enabled,
                "source": "rules_engine" if rule_required else "organization_configuration",
            },
            new_value={
                "key": module_key,
                "enabled": enabled,
                "source": "rules_engine" if rule_required else "organization_configuration",
            },
        )
        return module

    @staticmethod
    def allowed_entity_types() -> list[str]:
        return sorted(ALLOWED_ENTITY_TYPES)
