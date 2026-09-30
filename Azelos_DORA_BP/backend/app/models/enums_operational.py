"""Operational DORA entities — incidents, tests, continuity."""

import enum


class IncidentStatus(str, enum.Enum):
    DETECTED = "detected"
    CLASSIFIED = "classified"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"
    POST_INCIDENT_REVIEW = "post_incident_review"


class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentLinkKind(str, enum.Enum):
    BUSINESS_SERVICE = "business_service"
    BUSINESS_FUNCTION = "business_function"
    ICT_ASSET = "ict_asset"
    ICT_SERVICE = "ict_service"
    ICT_PROVIDER = "ict_provider"
    RISK_ASSESSMENT = "risk_assessment"


class ResilienceTestStatus(str, enum.Enum):
    PLANNED = "planned"
    SCOPED = "scoped"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CLOSED = "closed"


class ResilienceTestKind(str, enum.Enum):
    VULNERABILITY_ASSESSMENT = "vulnerability_assessment"
    PENETRATION_TEST = "penetration_test"
    SCENARIO = "scenario"
    BUSINESS_CONTINUITY = "business_continuity"
    DISASTER_RECOVERY = "disaster_recovery"
    FAILOVER = "failover"
    BACKUP_RESTORE = "backup_restore"
    TLPT = "tlpt"


class TlptExerciseStatus(str, enum.Enum):
    SCOPED = "scoped"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    REPORTING = "reporting"
    CLOSED = "closed"


class ContinuityPlanStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    UNDER_REVIEW = "under_review"
    ARCHIVED = "archived"


class RiskLifecycleStatus(str, enum.Enum):
    IDENTIFICATION = "identification"
    ASSESSMENT = "assessment"
    TREATMENT = "treatment"
    MONITORING = "monitoring"
    ACCEPTED = "accepted"
    MITIGATED = "mitigated"
    REVIEW = "review"


class DeadlineKind(str, enum.Enum):
    RISK_DUE = "risk_due"
    REMEDIATION_DUE = "remediation_due"
    EVIDENCE_EXPIRY = "evidence_expiry"
    CONTRACT_END = "contract_end"
    TEST_PLANNED = "test_planned"
    ASSESSMENT_REVIEW = "assessment_review"
