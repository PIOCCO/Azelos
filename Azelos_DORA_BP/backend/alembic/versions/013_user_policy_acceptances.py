"""User policy acceptance audit records

Revision ID: 013_user_policy_acceptances
Revises: 012_integration_audit_enum
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "013_user_policy_acceptances"
down_revision: Union[str, None] = "012_integration_audit_enum"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_policy_acceptances",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "financial_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_entities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("policy_key", sa.String(64), nullable=False),
        sa.Column("policy_version", sa.String(32), nullable=False),
        sa.Column("app_version", sa.String(64), nullable=True),
        sa.Column("ip_address", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("accepted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_user_policy_acceptances_user_id", "user_policy_acceptances", ["user_id"])
    op.create_index("ix_user_policy_acceptances_financial_entity_id", "user_policy_acceptances", ["financial_entity_id"])
    op.create_index("ix_user_policy_acceptances_policy_key", "user_policy_acceptances", ["policy_key"])


def downgrade() -> None:
    op.drop_table("user_policy_acceptances")
