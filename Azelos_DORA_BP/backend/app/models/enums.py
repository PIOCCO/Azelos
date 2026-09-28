"""PostgreSQL-backed enumerations for controlled vocabularies."""

import enum


class ProviderStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ONBOARDING = "onboarding"
    OFFBOARDING = "offboarding"
    SUSPENDED = "suspended"


class ProviderType(str, enum.Enum):
    ICT_THIRD_PARTY = "ict_third_party"
    INTRA_GROUP = "intra_group"
    CLOUD_SERVICE = "cloud_service"
    SOFTWARE_VENDOR = "software_vendor"
    OTHER = "other"


class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"
    PENDING_RENEWAL = "pending_renewal"


class ContractType(str, enum.Enum):
    MASTER_SERVICES = "master_services"
    SUBSCRIPTION = "subscription"
    LICENSE = "license"
    OUTSOURCING = "outsourcing"
    OTHER = "other"


class ServiceStatus(str, enum.Enum):
    ACTIVE = "active"
    PLANNED = "planned"
    DECOMMISSIONED = "decommissioned"


class CriticalOrImportant(str, enum.Enum):
    CRITICAL = "critical"
    IMPORTANT = "important"
    NEITHER = "neither"


class BusinessFunctionStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    UNDER_REVIEW = "under_review"


class SubcontractorStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskDimensionLevel(str, enum.Enum):
    """Ordinal inputs preserved for assessment calculation."""

    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "unverified"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ComplianceStatus(str, enum.Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NOT_ASSESSED = "not_assessed"
    PENDING_REVIEW = "pending_review"


class ExitStrategyStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    TESTED = "tested"
    REQUIRES_UPDATE = "requires_update"


class ExitTestResult(str, enum.Enum):
    NOT_TESTED = "not_tested"
    PASSED = "passed"
    FAILED = "failed"
    PARTIAL = "partial"


class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    APPROVE = "approve"
    REJECT = "reject"
    GENERATE_ROI = "generate_roi"
