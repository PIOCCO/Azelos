"""Cloud business resilience platform tables

Revision ID: 008_cloud_resilience
Revises: 007_profiles_ict
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "008_cloud_resilience"
down_revision: Union[str, None] = "007_profiles_ict"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_AUDIT_VALUES = (
    "login",
    "logout",
    "cloud_connect",
    "resource_discovery",
    "assessment_run",
    "evidence_upload",
    "finding_create",
    "finding_update",
    "remediation_update",
    "recovery_test_create",
    "report_generate",
)


def _create_enums() -> None:
    bind = op.get_bind()
    for name, values in (
        (
            "cloud_provider_type",
            ("azure", "aws", "gcp"),
        ),
        ("cloud_account_status", ("active", "disconnected", "error")),
        (
            "provenance_type",
            ("discovered", "user_provided", "manually_verified", "unknown"),
        ),
        (
            "evidence_source_kind",
            (
                "discovered_config",
                "upload",
                "user_entry",
                "calculated",
                "recommendation",
                "policy",
                "recovery_test",
                "incident",
            ),
        ),
        (
            "resilience_control_area",
            (
                "backup",
                "disaster_recovery",
                "high_availability",
                "monitoring",
                "identity",
                "access_control",
                "data_protection",
                "redundancy",
                "recovery_testing",
                "incident_response",
                "dependency_resilience",
                "configuration_resilience",
            ),
        ),
        (
            "assessment_result",
            ("pass", "fail", "partial", "unknown", "not_applicable"),
        ),
        ("finding_severity", ("low", "medium", "high", "critical")),
        (
            "finding_status",
            ("open", "in_progress", "resolved", "accepted_risk"),
        ),
        (
            "remediation_status",
            ("open", "in_progress", "blocked", "resolved", "accepted_risk"),
        ),
        (
            "recovery_test_outcome",
            ("pass", "fail", "partial", "not_run"),
        ),
        (
            "dora_control_implementation_status",
            (
                "implemented",
                "partially_implemented",
                "not_implemented",
                "insufficient_evidence",
                "not_assessed",
            ),
        ),
        (
            "business_service_status",
            ("active", "inactive", "planned", "decommissioned"),
        ),
        (
            "business_service_criticality",
            ("critical", "high", "medium", "low"),
        ),
        (
            "service_dependency_kind",
            (
                "logical",
                "infrastructure",
                "network",
                "identity",
                "data",
                "frontend",
                "api",
            ),
        ),
        (
            "cloud_resource_status",
            ("active", "stopped", "deleted", "unknown"),
        ),
    ):
        postgresql.ENUM(*values, name=name).create(bind, checkfirst=True)


def upgrade() -> None:
    bind = op.get_bind()
    for val in NEW_AUDIT_VALUES:
        op.execute(f"ALTER TYPE audit_action ADD VALUE IF NOT EXISTS '{val}'")

    _create_enums()

    cloud_provider = postgresql.ENUM(name="cloud_provider_type", create_type=False)
    cloud_account_status = postgresql.ENUM(name="cloud_account_status", create_type=False)
    business_service_status = postgresql.ENUM(name="business_service_status", create_type=False)
    business_service_criticality = postgresql.ENUM(
        name="business_service_criticality", create_type=False
    )
    cloud_resource_status = postgresql.ENUM(name="cloud_resource_status", create_type=False)
    provenance = postgresql.ENUM(name="provenance_type", create_type=False)
    service_dependency_kind = postgresql.ENUM(name="service_dependency_kind", create_type=False)
    resilience_area = postgresql.ENUM(name="resilience_control_area", create_type=False)
    assessment_result = postgresql.ENUM(name="assessment_result", create_type=False)
    evidence_source = postgresql.ENUM(name="evidence_source_kind", create_type=False)
    finding_severity = postgresql.ENUM(name="finding_severity", create_type=False)
    finding_status = postgresql.ENUM(name="finding_status", create_type=False)
    remediation_status = postgresql.ENUM(name="remediation_status", create_type=False)
    recovery_outcome = postgresql.ENUM(name="recovery_test_outcome", create_type=False)
    dora_impl = postgresql.ENUM(name="dora_control_implementation_status", create_type=False)

    op.create_table(
        "cloud_accounts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("provider", cloud_provider, nullable=False),
        sa.Column("display_name", sa.String(length=256), nullable=False),
        sa.Column("subscription_id", sa.String(length=128), nullable=False),
        sa.Column("tenant_id", sa.String(length=128), nullable=True),
        sa.Column("default_region", sa.String(length=64), nullable=True),
        sa.Column("status", cloud_account_status, nullable=False),
        sa.Column("auth_config_ref", sa.String(length=64), nullable=True),
        sa.Column("last_discovery_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_discovery_status", sa.String(length=512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "financial_entity_id",
            "provider",
            "subscription_id",
            name="uq_cloud_account_subscription",
        ),
    )
    op.create_index("ix_cloud_accounts_financial_entity_id", "cloud_accounts", ["financial_entity_id"])

    op.create_table(
        "business_services",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("criticality", business_service_criticality, nullable=False),
        sa.Column("business_owner", sa.String(length=256), nullable=True),
        sa.Column("technical_owner", sa.String(length=256), nullable=True),
        sa.Column("rto_minutes", sa.Integer(), nullable=True),
        sa.Column("rpo_minutes", sa.Integer(), nullable=True),
        sa.Column("availability_target", sa.String(length=64), nullable=True),
        sa.Column("status", business_service_status, nullable=False),
        sa.Column("measured_recovery_minutes", sa.Integer(), nullable=True),
        sa.Column("measured_data_loss_minutes", sa.Integer(), nullable=True),
        sa.Column("last_recovery_test_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_business_services_financial_entity_id",
        "business_services",
        ["financial_entity_id"],
    )

    op.create_table(
        "cloud_resources",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("cloud_account_id", sa.UUID(), nullable=False),
        sa.Column("business_service_id", sa.UUID(), nullable=True),
        sa.Column("provider_resource_id", sa.String(length=512), nullable=False),
        sa.Column("resource_type", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=512), nullable=False),
        sa.Column("resource_group", sa.String(length=256), nullable=True),
        sa.Column("region", sa.String(length=64), nullable=True),
        sa.Column("status", cloud_resource_status, nullable=False),
        sa.Column("provenance", provenance, nullable=False),
        sa.Column("last_discovered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["cloud_account_id"], ["cloud_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["business_service_id"], ["business_services.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "cloud_account_id",
            "provider_resource_id",
            name="uq_cloud_resource_provider_id",
        ),
    )
    op.create_index("ix_cloud_resources_financial_entity_id", "cloud_resources", ["financial_entity_id"])
    op.create_index("ix_cloud_resources_cloud_account_id", "cloud_resources", ["cloud_account_id"])
    op.create_index("ix_cloud_resources_business_service_id", "cloud_resources", ["business_service_id"])

    op.create_table(
        "service_dependencies",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("business_service_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("dependency_kind", service_dependency_kind, nullable=False),
        sa.Column("cloud_resource_id", sa.UUID(), nullable=True),
        sa.Column("provenance", provenance, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_service_id"], ["business_services.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cloud_resource_id"], ["cloud_resources.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_service_dependencies_business_service_id",
        "service_dependencies",
        ["business_service_id"],
    )

    op.create_table(
        "resilience_assessments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("business_service_id", sa.UUID(), nullable=False),
        sa.Column("assessed_by", sa.String(length=256), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("has_gaps", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_service_id"], ["business_services.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_resilience_assessments_financial_entity_id",
        "resilience_assessments",
        ["financial_entity_id"],
    )

    op.create_table(
        "resilience_assessment_controls",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("assessment_id", sa.UUID(), nullable=False),
        sa.Column("cloud_resource_id", sa.UUID(), nullable=True),
        sa.Column("control_area", resilience_area, nullable=False),
        sa.Column("result", assessment_result, nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("source_kind", evidence_source, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["assessment_id"], ["resilience_assessments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cloud_resource_id"], ["cloud_resources.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_resilience_assessment_controls_assessment_id",
        "resilience_assessment_controls",
        ["assessment_id"],
    )

    op.create_table(
        "resilience_findings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("severity", finding_severity, nullable=False),
        sa.Column("status", finding_status, nullable=False),
        sa.Column("business_service_id", sa.UUID(), nullable=True),
        sa.Column("cloud_resource_id", sa.UUID(), nullable=True),
        sa.Column("organization_requirement_id", sa.UUID(), nullable=True),
        sa.Column("control_area", resilience_area, nullable=True),
        sa.Column("recommendation", sa.Text(), nullable=True),
        sa.Column("owner", sa.String(length=256), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(length=256), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_service_id"], ["business_services.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cloud_resource_id"], ["cloud_resources.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["organization_requirement_id"],
            ["organization_requirements.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resilience_findings_financial_entity_id", "resilience_findings", ["financial_entity_id"])
    op.create_index("ix_resilience_findings_status", "resilience_findings", ["status"])

    op.create_table(
        "remediation_actions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("finding_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("owner", sa.String(length=256), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("status", remediation_status, nullable=False),
        sa.Column("verification_notes", sa.Text(), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["finding_id"], ["resilience_findings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_remediation_actions_finding_id", "remediation_actions", ["finding_id"])
    op.create_index(
        "ix_remediation_actions_financial_entity_id",
        "remediation_actions",
        ["financial_entity_id"],
    )

    op.create_table(
        "resilience_evidence_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("source_kind", evidence_source, nullable=False),
        sa.Column("provenance", provenance, nullable=False),
        sa.Column(
            "collected_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("review_due", sa.Date(), nullable=True),
        sa.Column("business_service_id", sa.UUID(), nullable=True),
        sa.Column("cloud_resource_id", sa.UUID(), nullable=True),
        sa.Column("organization_requirement_id", sa.UUID(), nullable=True),
        sa.Column("uploaded_evidence_id", sa.UUID(), nullable=True),
        sa.Column("collected_by", sa.String(length=256), nullable=False),
        sa.Column("verification_status", sa.String(length=32), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_service_id"], ["business_services.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cloud_resource_id"], ["cloud_resources.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["organization_requirement_id"],
            ["organization_requirements.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(["uploaded_evidence_id"], ["evidence.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_resilience_evidence_financial_entity_id",
        "resilience_evidence_items",
        ["financial_entity_id"],
    )

    op.create_table(
        "recovery_tests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("business_service_id", sa.UUID(), nullable=False),
        sa.Column("scenario", sa.String(length=512), nullable=False),
        sa.Column("target_rto_minutes", sa.Integer(), nullable=True),
        sa.Column("target_rpo_minutes", sa.Integer(), nullable=True),
        sa.Column("actual_recovery_minutes", sa.Integer(), nullable=True),
        sa.Column("actual_data_loss_minutes", sa.Integer(), nullable=True),
        sa.Column("outcome", recovery_outcome, nullable=False),
        sa.Column("participants", sa.Text(), nullable=True),
        sa.Column("executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(length=256), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_service_id"], ["business_services.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recovery_tests_financial_entity_id", "recovery_tests", ["financial_entity_id"])

    op.create_table(
        "business_service_dora_links",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("business_service_id", sa.UUID(), nullable=False),
        sa.Column("organization_requirement_id", sa.UUID(), nullable=False),
        sa.Column("implementation_status", dora_impl, nullable=False),
        sa.Column("last_assessed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_review_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("owner", sa.String(length=256), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["business_service_id"], ["business_services.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["organization_requirement_id"],
            ["organization_requirements.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "business_service_id",
            "organization_requirement_id",
            name="uq_service_dora_requirement",
        ),
    )


def downgrade() -> None:
    op.drop_table("business_service_dora_links")
    op.drop_table("recovery_tests")
    op.drop_table("resilience_evidence_items")
    op.drop_table("remediation_actions")
    op.drop_table("resilience_findings")
    op.drop_table("resilience_assessment_controls")
    op.drop_table("resilience_assessments")
    op.drop_table("service_dependencies")
    op.drop_table("cloud_resources")
    op.drop_table("business_services")
    op.drop_table("cloud_accounts")

    bind = op.get_bind()
    for name in (
        "cloud_resource_status",
        "service_dependency_kind",
        "business_service_criticality",
        "business_service_status",
        "dora_control_implementation_status",
        "recovery_test_outcome",
        "remediation_status",
        "finding_status",
        "finding_severity",
        "assessment_result",
        "resilience_control_area",
        "evidence_source_kind",
        "provenance_type",
        "cloud_account_status",
        "cloud_provider_type",
    ):
        postgresql.ENUM(name=name).drop(bind, checkfirst=True)
