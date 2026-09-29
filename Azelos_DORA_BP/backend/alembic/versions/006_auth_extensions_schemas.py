"""auth users, memberships, client_extensions schema

Revision ID: 006_auth_ext
Revises: 005_config_reference_data
Create Date: 2026-09-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_auth_ext"
down_revision: Union[str, None] = "005_config_reference_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

user_role = postgresql.ENUM(
    "SUPER_ADMIN",
    "ORG_ADMIN",
    "RISK_MANAGER",
    "SECURITY_MANAGER",
    "BUSINESS_CONTINUITY_MANAGER",
    "AUDITOR",
    "USER",
    name="user_role",
    create_type=False,
)


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS dora_core")
    op.execute("CREATE SCHEMA IF NOT EXISTS dora_config")
    op.execute("CREATE SCHEMA IF NOT EXISTS client_extensions")

    user_role.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("hashed_password", sa.String(length=256), nullable=False),
        sa.Column("full_name", sa.String(length=256), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "organization_memberships",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="USER"),
        sa.ForeignKeyConstraint(["financial_entity_id"], ["financial_entities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "financial_entity_id", name="uq_user_org"),
    )
    op.create_table(
        "extension_registrations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("financial_entity_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("version", sa.String(length=64), nullable=True),
        sa.Column("owner", sa.String(length=256), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="registered"),
        sa.Column("resource_type", sa.String(length=64), nullable=True),
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
        schema="client_extensions",
    )


def downgrade() -> None:
    op.drop_table("extension_registrations", schema="client_extensions")
    op.drop_table("organization_memberships")
    op.drop_table("users")
    user_role.drop(op.get_bind(), checkfirst=True)
