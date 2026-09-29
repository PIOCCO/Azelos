"""Configuration / metadata layer database tests."""

import uuid

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.models.custom_fields import CustomFieldDefinition, CustomFieldValue
from app.models.enums_config import CustomFieldType
from app.models.financial_entity import FinancialEntity
from app.models.platform_config import OrganizationModule, PlatformModule
from app.services.custom_field_validation import (
    CustomFieldValidationError,
    validate_value,
)


def test_platform_module_unique_key(db_session):
    db_session.add(
        PlatformModule(key="TEST_MOD", name="Test", description="x", system_defined=True)
    )
    db_session.flush()
    db_session.add(
        PlatformModule(key="TEST_MOD", name="Dup", description="y", system_defined=True)
    )
    with pytest.raises(IntegrityError):
        db_session.flush()


def test_org_module_isolation(db_session):
    fe1 = FinancialEntity(legal_name="Org1", country_code="DE")
    fe2 = FinancialEntity(legal_name="Org2", country_code="FR")
    mod = PlatformModule(key="ISO_MOD", name="M", system_defined=True)
    db_session.add_all([fe1, fe2, mod])
    db_session.flush()
    db_session.add(
        OrganizationModule(
            financial_entity_id=fe1.id, platform_module_id=mod.id, enabled=True
        )
    )
    db_session.flush()
    row = db_session.scalar(
        select(OrganizationModule).where(
            OrganizationModule.financial_entity_id == fe2.id
        )
    )
    assert row is None


def test_custom_field_definition_and_value(db_session):
    fe = FinancialEntity(legal_name="CF Bank", country_code="LU")
    db_session.add(fe)
    db_session.flush()
    defn = CustomFieldDefinition(
        financial_entity_id=fe.id,
        entity_type="ict_service",
        field_key="recovery_tier",
        display_name="Recovery Tier",
        field_type=CustomFieldType.SELECT,
        options=["Tier 1", "Tier 2"],
        required=True,
    )
    db_session.add(defn)
    db_session.flush()
    svc_id = uuid.uuid4()
    db_session.add(
        CustomFieldValue(
            financial_entity_id=fe.id,
            field_definition_id=defn.id,
            entity_type="ict_service",
            entity_id=svc_id,
            value="Tier 1",
        )
    )
    db_session.flush()


def test_custom_field_select_validation():
    with pytest.raises(CustomFieldValidationError):
        validate_value(
            CustomFieldType.SELECT,
            "Tier 9",
            required=True,
            options=["Tier 1", "Tier 2"],
        )
    assert (
        validate_value(
            CustomFieldType.SELECT,
            "Tier 1",
            required=True,
            options=["Tier 1", "Tier 2"],
        )
        == "Tier 1"
    )


def test_duplicate_custom_field_key_per_org(db_session):
    fe = FinancialEntity(legal_name="Dup CF", country_code="DE")
    db_session.add(fe)
    db_session.flush()
    db_session.add(
        CustomFieldDefinition(
            financial_entity_id=fe.id,
            entity_type="contract",
            field_key="vendor_ref",
            display_name="Vendor Ref",
            field_type=CustomFieldType.TEXT,
        )
    )
    db_session.flush()
    db_session.add(
        CustomFieldDefinition(
            financial_entity_id=fe.id,
            entity_type="contract",
            field_key="vendor_ref",
            display_name="Dup",
            field_type=CustomFieldType.TEXT,
        )
    )
    with pytest.raises(IntegrityError):
        db_session.flush()
