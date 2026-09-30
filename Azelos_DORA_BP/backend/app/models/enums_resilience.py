"""Enumerations for cloud resilience platform."""

import enum


class CloudProviderType(str, enum.Enum):
    AZURE = "azure"
    AWS = "aws"
    GCP = "gcp"


class CloudAccountStatus(str, enum.Enum):
    ACTIVE = "active"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class ProvenanceType(str, enum.Enum):
    DISCOVERED = "discovered"
    USER_PROVIDED = "user_provided"
    MANUALLY_VERIFIED = "manually_verified"
    UNKNOWN = "unknown"


class EvidenceSourceKind(str, enum.Enum):
    DISCOVERED_CONFIG = "discovered_config"
    UPLOAD = "upload"
    USER_ENTRY = "user_entry"
    CALCULATED = "calculated"
    RECOMMENDATION = "recommendation"
    POLICY = "policy"
    RECOVERY_TEST = "recovery_test"
    INCIDENT = "incident"


class ResilienceControlArea(str, enum.Enum):
    BACKUP = "backup"
    DISASTER_RECOVERY = "disaster_recovery"
    HIGH_AVAILABILITY = "high_availability"
    MONITORING = "monitoring"
    IDENTITY = "identity"
    ACCESS_CONTROL = "access_control"
    DATA_PROTECTION = "data_protection"
    REDUNDANCY = "redundancy"
    RECOVERY_TESTING = "recovery_testing"
    INCIDENT_RESPONSE = "incident_response"
    DEPENDENCY_RESILIENCE = "dependency_resilience"
    CONFIGURATION_RESILIENCE = "configuration_resilience"


class AssessmentResult(str, enum.Enum):
    PASS = "pass"
    FAIL = "fail"
    PARTIAL = "partial"
    UNKNOWN = "unknown"
    NOT_APPLICABLE = "not_applicable"


class FindingSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FindingStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ACCEPTED_RISK = "accepted_risk"


class RemediationStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    RESOLVED = "resolved"
    ACCEPTED_RISK = "accepted_risk"


class RecoveryTestOutcome(str, enum.Enum):
    PASS = "pass"
    FAIL = "fail"
    PARTIAL = "partial"
    NOT_RUN = "not_run"


class DoraControlImplementationStatus(str, enum.Enum):
    IMPLEMENTED = "implemented"
    PARTIALLY_IMPLEMENTED = "partially_implemented"
    NOT_IMPLEMENTED = "not_implemented"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    NOT_ASSESSED = "not_assessed"


class BusinessServiceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PLANNED = "planned"
    DECOMMISSIONED = "decommissioned"


class BusinessServiceCriticality(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ServiceDependencyKind(str, enum.Enum):
    LOGICAL = "logical"
    INFRASTRUCTURE = "infrastructure"
    NETWORK = "network"
    IDENTITY = "identity"
    DATA = "data"
    FRONTEND = "frontend"
    API = "api"


class CloudResourceStatus(str, enum.Enum):
    ACTIVE = "active"
    STOPPED = "stopped"
    DELETED = "deleted"
    UNKNOWN = "unknown"
