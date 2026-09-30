"""Operational DORA entities — incidents, tests, BCP/DR, TLPT, risk lifecycle

Revision ID: 009_operational_dora
Revises: 008_cloud_resilience
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "009_operational_dora"
down_revision: Union[str, None] = "008_cloud_resilience"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _enum(name: str, values: tuple[str, ...]) -> postgresql.ENUM:
    e = postgresql.ENUM(*values, name=name, create_type=False)
    return e


def upgrade() -> None:
    bind = op.get_bind()
    for name, values in (
        (
            "ict_incident_status",
            (
                "detected",
                "classified",
                "investigating",
                "contained",
                "resolved",
                "closed",
                "post_incident_review",
            ),
        ),
        ("ict_incident_severity", ("low", "medium", "high", "critical")),
        (
            "ict_incident_link_kind",
            (
                "business_service",
                "business_function",
                "ict_asset",
                "ict_service",
                "ict_provider",
                "risk_assessment",
            ),
        ),
        (
            "resilience_test_status",
            ("planned", "scoped", "in_progress", "completed", "failed", "closed"),
        ),
        (
            "resilience_test_kind",
            (
                "vulnerability_assessment",
                "penetration_test",
                "scenario",
                "business_continuity",
                "disaster_recovery",
                "failover",
                "backup_restore",
                "tlpt",
            ),
        ),
        ("tlpt_exercise_status", ("scoped", "planned", "in_progress", "reporting", "closed")),
        ("continuity_plan_status", ("draft", "active", "under_review", "archived")),
        (
            "risk_lifecycle_status",
            (
                "identification",
                "assessment",
                "treatment",
                "monitoring",
                "accepted",
                "mitigated",
                "review",
            ),
        ),
    ):
        postgresql.ENUM(*values, name=name).create(bind, checkfirst=True)

    op.create_table(
        "ict_incidents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "financial_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_entities.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("severity", _enum("ict_incident_severity", ("low", "medium", "high", "critical")), nullable=False),
        sa.Column(
            "status",
            _enum(
                "ict_incident_status",
                (
                    "detected",
                    "classified",
                    "investigating",
                    "contained",
                    "resolved",
                    "closed",
                    "post_incident_review",
                ),
            ),
            nullable=False,
            server_default="detected",
        ),
        sa.Column("is_major", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("owner", sa.String(256)),
        sa.Column("detected_at", sa.DateTime(timezone=True)),
        sa.Column("classified_at", sa.DateTime(timezone=True)),
        sa.Column("contained_at", sa.DateTime(timezone=True)),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.Column("closed_at", sa.DateTime(timezone=True)),
        sa.Column("root_cause", sa.Text()),
        sa.Column("lessons_learned", sa.Text()),
        sa.Column("archived_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ict_incidents_financial_entity_id", "ict_incidents", ["financial_entity_id"])
    op.create_index("ix_ict_incidents_status", "ict_incidents", ["status"])
    op.create_index("ix_ict_incidents_severity", "ict_incidents", ["severity"])

    op.create_table(
        "ict_incident_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "incident_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ict_incidents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "link_kind",
            _enum(
                "ict_incident_link_kind",
                (
                    "business_service",
                    "business_function",
                    "ict_asset",
                    "ict_service",
                    "ict_provider",
                    "risk_assessment",
                ),
            ),
            nullable=False,
        ),
        sa.Column("linked_entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("notes", sa.String(512)),
        sa.UniqueConstraint("incident_id", "link_kind", "linked_entity_id", name="uq_incident_link"),
    )
    op.create_index("ix_ict_incident_links_incident_id", "ict_incident_links", ["incident_id"])

    op.create_table(
        "ict_incident_timeline",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "incident_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ict_incidents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("actor", sa.String(256), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ict_incident_timeline_incident_id", "ict_incident_timeline", ["incident_id"])

    op.create_table(
        "resilience_tests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "financial_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_entities.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column(
            "test_kind",
            _enum(
                "resilience_test_kind",
                (
                    "vulnerability_assessment",
                    "penetration_test",
                    "scenario",
                    "business_continuity",
                    "disaster_recovery",
                    "failover",
                    "backup_restore",
                    "tlpt",
                ),
            ),
            nullable=False,
        ),
        sa.Column(
            "status",
            _enum(
                "resilience_test_status",
                ("planned", "scoped", "in_progress", "completed", "failed", "closed"),
            ),
            nullable=False,
            server_default="planned",
        ),
        sa.Column("scenario", sa.Text()),
        sa.Column("scope_summary", sa.Text()),
        sa.Column("owner", sa.String(256)),
        sa.Column("planned_date", sa.Date()),
        sa.Column("executed_at", sa.DateTime(timezone=True)),
        sa.Column("outcome_summary", sa.Text()),
        sa.Column(
            "business_service_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("business_services.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "ict_asset_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ict_assets.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "recovery_test_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recovery_tests.id", ondelete="SET NULL"),
        ),
        sa.Column("archived_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_resilience_tests_financial_entity_id", "resilience_tests", ["financial_entity_id"])

    op.create_table(
        "tlpt_exercises",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "financial_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_entities.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column(
            "status",
            _enum("tlpt_exercise_status", ("scoped", "planned", "in_progress", "reporting", "closed")),
            nullable=False,
            server_default="scoped",
        ),
        sa.Column("scope_summary", sa.Text()),
        sa.Column("threat_intelligence_summary", sa.Text()),
        sa.Column("attack_scenario", sa.Text()),
        sa.Column("owner", sa.String(256)),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("final_report_summary", sa.Text()),
        sa.Column("archived_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_tlpt_exercises_financial_entity_id", "tlpt_exercises", ["financial_entity_id"])

    plan_status = _enum("continuity_plan_status", ("draft", "active", "under_review", "archived"))
    op.create_table(
        "business_continuity_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "financial_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_entities.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("status", plan_status, nullable=False, server_default="draft"),
        sa.Column(
            "business_service_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("business_services.id", ondelete="SET NULL"),
        ),
        sa.Column("owner", sa.String(256)),
        sa.Column("rto_minutes", sa.Integer()),
        sa.Column("rpo_minutes", sa.Integer()),
        sa.Column("backup_strategy", sa.Text()),
        sa.Column("last_review_at", sa.Date()),
        sa.Column("archived_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_bcp_financial_entity_id", "business_continuity_plans", ["financial_entity_id"])

    op.create_table(
        "disaster_recovery_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "financial_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_entities.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("status", plan_status, nullable=False, server_default="draft"),
        sa.Column(
            "business_service_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("business_services.id", ondelete="SET NULL"),
        ),
        sa.Column("owner", sa.String(256)),
        sa.Column("recovery_strategy", sa.Text()),
        sa.Column("failover_capability", sa.Text()),
        sa.Column("last_recovery_test_at", sa.Date()),
        sa.Column("archived_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_drp_financial_entity_id", "disaster_recovery_plans", ["financial_entity_id"])

    risk_lifecycle = _enum(
        "risk_lifecycle_status",
        (
            "identification",
            "assessment",
            "treatment",
            "monitoring",
            "accepted",
            "mitigated",
            "review",
        ),
    )
    op.add_column("risk_assessments", sa.Column("title", sa.String(512)))
    op.add_column("risk_assessments", sa.Column("owner", sa.String(256)))
    op.add_column("risk_assessments", sa.Column("treatment_plan", sa.Text()))
    op.add_column("risk_assessments", sa.Column("due_date", sa.Date()))
    op.add_column(
        "risk_assessments",
        sa.Column("likelihood", postgresql.ENUM(name="risk_dimension_level", create_type=False)),
    )
    op.add_column(
        "risk_assessments",
        sa.Column("impact", postgresql.ENUM(name="risk_dimension_level", create_type=False)),
    )
    op.add_column(
        "risk_assessments",
        sa.Column("inherent_risk_level", postgresql.ENUM(name="risk_level", create_type=False)),
    )
    op.add_column(
        "risk_assessments",
        sa.Column("residual_risk_level", postgresql.ENUM(name="risk_level", create_type=False)),
    )
    op.add_column(
        "risk_assessments",
        sa.Column(
            "lifecycle_status",
            risk_lifecycle,
            nullable=False,
            server_default="assessment",
        ),
    )
    op.add_column("risk_assessments", sa.Column("archived_at", sa.DateTime(timezone=True)))


def downgrade() -> None:
    op.drop_column("risk_assessments", "archived_at")
    op.drop_column("risk_assessments", "lifecycle_status")
    op.drop_column("risk_assessments", "residual_risk_level")
    op.drop_column("risk_assessments", "inherent_risk_level")
    op.drop_column("risk_assessments", "impact")
    op.drop_column("risk_assessments", "likelihood")
    op.drop_column("risk_assessments", "due_date")
    op.drop_column("risk_assessments", "treatment_plan")
    op.drop_column("risk_assessments", "owner")
    op.drop_column("risk_assessments", "title")
    for table in ("disaster_recovery_plans", "business_continuity_plans", "tlpt_exercises", "resilience_tests"):
        op.drop_table(table)
    op.drop_table("ict_incident_timeline")
    op.drop_table("ict_incident_links")
    op.drop_table("ict_incidents")
