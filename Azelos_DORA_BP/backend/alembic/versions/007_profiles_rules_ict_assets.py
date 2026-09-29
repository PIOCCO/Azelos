"""Organization profiles, profile rules, ICT assets

Revision ID: 007_profiles_ict
Revises: 006_auth_ext
"""

from typing import Sequence, Union
import json
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "007_profiles_ict"
down_revision: Union[str, None] = "006_auth_ext"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

organization_type = postgresql.ENUM(
    "credit_institution",
    "payment_institution",
    "e_money_institution",
    "investment_firm",
    "insurance_undertaking",
    "reinsurance_undertaking",
    "casp",
    "other_financial_entity",
    name="organization_type",
    create_type=False,
)
organization_size = postgresql.ENUM(
    "small",
    "medium",
    "large",
    "group",
    name="organization_size_category",
    create_type=False,
)
regulatory_status = postgresql.ENUM(
    "authorized",
    "passporting",
    "pending",
    "other",
    name="regulatory_status",
    create_type=False,
)


def upgrade() -> None:
    organization_type.create(op.get_bind(), checkfirst=True)
    organization_size.create(op.get_bind(), checkfirst=True)
    regulatory_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "organization_profiles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("organization_type", organization_type, nullable=False),
        sa.Column("size_category", organization_size, nullable=False),
        sa.Column("regulatory_status", regulatory_status, nullable=False),
        sa.Column("art16_eligible", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "has_critical_functions",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("tlpt_applicable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
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
        sa.UniqueConstraint("financial_entity_id"),
    )
    op.create_index(
        "ix_organization_profiles_financial_entity_id",
        "organization_profiles",
        ["financial_entity_id"],
    )

    op.create_table(
        "information_assets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("asset_identifier", sa.String(length=128), nullable=False),
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
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "financial_entity_id",
            "asset_identifier",
            name="uq_information_asset_identifier_per_entity",
        ),
    )
    op.create_index(
        "ix_information_assets_financial_entity_id",
        "information_assets",
        ["financial_entity_id"],
    )

    op.create_table(
        "ict_assets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("information_asset_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=256), nullable=False),
        sa.Column("asset_identifier", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "inherent_criticality",
            postgresql.ENUM(
                "critical",
                "important",
                "neither",
                name="critical_or_important",
                create_type=False,
            ),
            nullable=False,
            server_default="neither",
        ),
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
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["information_asset_id"], ["information_assets.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "financial_entity_id",
            "asset_identifier",
            name="uq_ict_asset_identifier_per_entity",
        ),
    )
    op.create_index("ix_ict_assets_financial_entity_id", "ict_assets", ["financial_entity_id"])

    op.create_table(
        "asset_function_maps",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("function_id", sa.UUID(), nullable=False),
        sa.Column("ict_asset_id", sa.UUID(), nullable=False),
        sa.Column(
            "supports_critical_function",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
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
        sa.ForeignKeyConstraint(["function_id"], ["business_functions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ict_asset_id"], ["ict_assets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("function_id", "ict_asset_id", name="uq_function_ict_asset"),
    )
    op.create_index("ix_asset_function_maps_function_id", "asset_function_maps", ["function_id"])
    op.create_index("ix_asset_function_maps_ict_asset_id", "asset_function_maps", ["ict_asset_id"])

    op.create_table(
        "profile_rules",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("rule_key", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("conditions", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("outcomes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("system_defined", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rule_key"),
        schema="dora_config",
    )

    conn = op.get_bind()
    rules = [
        (
            "payment_art16_simplified_rmf",
            "Payment institution with Art. 16 eligibility may use simplified RMF",
            {"organization_type": "payment_institution", "art16_eligible": True},
            {"simplified_rmf": True},
        ),
        (
            "tlpt_module_when_applicable",
            "Enable TLPT capability when organization is TLPT-applicable",
            {"tlpt_applicable": True},
            {"module_keys": ["TLPT"], "tlpt_enabled": True},
        ),
        (
            "enhanced_resilience_critical_functions",
            "Enhanced resilience when org has critical/important functions",
            {"has_critical_functions": True},
            {"enhanced_resilience_requirements": True},
        ),
        (
            "critical_function_mapping_flag",
            "When any mapped function is critical, flag enhanced mapping requirements",
            {"any_critical_business_function": True},
            {"enhanced_resilience_requirements": True},
        ),
    ]
    for key, desc, cond, out in rules:
        conn.execute(
            sa.text(
                """
                INSERT INTO dora_config.profile_rules
                (id, rule_key, description, conditions, outcomes, active, system_defined)
                VALUES (:id, :key, :desc, CAST(:cond AS jsonb), CAST(:out AS jsonb), true, true)
                ON CONFLICT (rule_key) DO NOTHING
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "key": key,
                "desc": desc,
                "cond": json.dumps(cond),
                "out": json.dumps(out),
            },
        )

    # Default profile for existing financial entities
    conn.execute(
        sa.text(
            """
            INSERT INTO organization_profiles
            (id, financial_entity_id, organization_type, size_category, regulatory_status)
            SELECT gen_random_uuid(), id, 'credit_institution', 'medium', 'authorized'
            FROM financial_entities fe
            WHERE NOT EXISTS (
                SELECT 1 FROM organization_profiles op WHERE op.financial_entity_id = fe.id
            )
            """
        )
    )


def downgrade() -> None:
    op.drop_table("profile_rules", schema="dora_config")
    op.drop_table("asset_function_maps")
    op.drop_table("ict_assets")
    op.drop_table("information_assets")
    op.drop_table("organization_profiles")
    organization_type.drop(op.get_bind(), checkfirst=True)
    organization_size.drop(op.get_bind(), checkfirst=True)
    regulatory_status.drop(op.get_bind(), checkfirst=True)
