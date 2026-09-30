"""V1 SaaS lifecycle, BIA, requirement evidence links

Revision ID: 010_v1_saas_bia
Revises: 009_operational_dora
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "010_v1_saas_bia"
down_revision: Union[str, None] = "009_operational_dora"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    subscription_status = postgresql.ENUM(
        "trial",
        "active",
        "suspended",
        "cancelled",
        name="subscription_status",
        create_type=False,
    )
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    op.add_column(
        "financial_entities",
        sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("users", sa.Column("external_subject", sa.String(256), nullable=True))
    op.create_index("ix_users_external_subject", "users", ["external_subject"], unique=True)
    op.alter_column("users", "hashed_password", existing_type=sa.String(256), nullable=True)

    op.create_table(
        "organization_subscriptions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("plan_key", sa.String(64), nullable=False, server_default="standard"),
        sa.Column(
            "status",
            subscription_status,
            nullable=False,
            server_default="trial",
        ),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("financial_entity_id", name="uq_org_subscription_entity"),
    )
    op.create_index("ix_org_subscriptions_status", "organization_subscriptions", ["status"])

    op.create_table(
        "user_invitations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM(name="user_role", create_type=False),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("invited_by", sa.String(320), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_invitations_token_hash", "user_invitations", ["token_hash"], unique=True)
    op.create_index(
        "ix_user_invitations_org_email", "user_invitations", ["financial_entity_id", "email"]
    )

    op.create_table(
        "business_impact_assessments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("business_function_id", sa.UUID(), nullable=False),
        sa.Column("rto_hours", sa.Integer(), nullable=True),
        sa.Column("rpo_hours", sa.Integer(), nullable=True),
        sa.Column("mtd_hours", sa.Integer(), nullable=True),
        sa.Column("impact_summary", sa.Text(), nullable=True),
        sa.Column("review_owner", sa.Text(), nullable=True),
        sa.Column("last_reviewed_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["business_function_id"], ["business_functions.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_bia_financial_entity_id", "business_impact_assessments", ["financial_entity_id"]
    )
    op.create_index(
        "ix_bia_business_function_id", "business_impact_assessments", ["business_function_id"]
    )

    op.create_table(
        "requirement_evidence_links",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("organization_requirement_id", sa.UUID(), nullable=False),
        sa.Column("evidence_id", sa.UUID(), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["organization_requirement_id"],
            ["organization_requirements.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["evidence_id"], ["evidence.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_requirement_id", "evidence_id", name="uq_requirement_evidence"
        ),
    )
    op.create_index(
        "ix_req_evidence_org", "requirement_evidence_links", ["financial_entity_id"]
    )

    bind = op.get_bind()
    orgs = bind.execute(sa.text("SELECT id FROM financial_entities")).fetchall()
    for (org_id,) in orgs:
        exists = bind.execute(
            sa.text(
                "SELECT 1 FROM organization_subscriptions WHERE financial_entity_id = :org LIMIT 1"
            ),
            {"org": org_id},
        ).first()
        if not exists:
            bind.execute(
                sa.text(
                    """
                    INSERT INTO organization_subscriptions
                    (id, financial_entity_id, plan_key, status, activated_at, created_at, updated_at)
                    VALUES (gen_random_uuid(), :org, 'standard', 'active', now(), now(), now())
                    """
                ),
                {"org": org_id},
            )


def downgrade() -> None:
    op.drop_table("requirement_evidence_links")
    op.drop_table("business_impact_assessments")
    op.drop_table("user_invitations")
    op.drop_table("organization_subscriptions")
    op.drop_column("users", "external_subject")
    op.alter_column("users", "hashed_password", existing_type=sa.String(256), nullable=False)
    op.drop_column("financial_entities", "onboarding_completed_at")
    op.execute("DROP TYPE IF EXISTS subscription_status")
