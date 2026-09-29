"""Domain ORM models — import order registers all tables on Base.metadata."""

from app.models.audit import AuditRecord
from app.models.business_function import BusinessFunction, FunctionServiceMapping
from app.models.contract import Contract
from app.models.dora_control import (
    ContractDoraControl,
    DoraControlDefinition,
    EvidenceControlLink,
)
from app.models.evidence import DocumentType, Evidence
from app.models.exit_strategy import ExitStrategy
from app.models.financial_entity import FinancialEntity
from app.models.provider import ICTProvider
from app.models.risk import RiskAssessment
from app.models.service import ICTService, ServiceClassification
from app.models.subcontractor import Subcontractor
from app.models.platform_config import OrganizationModule, OrganizationSetting, PlatformModule
from app.models.custom_fields import CustomFieldDefinition, CustomFieldValue
from app.models.dora_baseline import DoraDomain, DoraRequirement, OrganizationRequirement
from app.models.configuration_audit import ConfigurationAuditLog
from app.models.auth import OrganizationMembership, User
from app.models.extensions import ExtensionRegistration
from app.models.organization_profile import OrganizationProfile
from app.models.profile_rules import ProfileRule
from app.models.ict_assets import AssetFunctionMap, ICTAsset, InformationAsset

__all__ = [
    "AuditRecord",
    "BusinessFunction",
    "Contract",
    "ContractDoraControl",
    "DocumentType",
    "DoraControlDefinition",
    "Evidence",
    "EvidenceControlLink",
    "ExitStrategy",
    "FinancialEntity",
    "FunctionServiceMapping",
    "ICTProvider",
    "ICTService",
    "RiskAssessment",
    "ServiceClassification",
    "Subcontractor",
    "PlatformModule",
    "OrganizationModule",
    "OrganizationSetting",
    "CustomFieldDefinition",
    "CustomFieldValue",
    "DoraDomain",
    "DoraRequirement",
    "OrganizationRequirement",
    "ConfigurationAuditLog",
    "User",
    "OrganizationMembership",
    "ExtensionRegistration",
    "OrganizationProfile",
    "ProfileRule",
    "InformationAsset",
    "ICTAsset",
    "AssetFunctionMap",
]
