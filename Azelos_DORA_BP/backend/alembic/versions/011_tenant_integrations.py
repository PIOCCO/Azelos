"""Per-tenant external integrations (hosted SaaS configuration)

Revision ID: 011_tenant_integrations
Revises: 010_v1_saas_bia
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "011_tenant_integrations"
down_revision: Union[str, None] = "010_v1_saas_bia"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenant_integrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "financial_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_entities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("integration_type", sa.String(32), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="not_configured"),
        sa.Column("config", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("secrets_encrypted", sa.LargeBinary(), nullable=True),
        sa.Column("last_test_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_test_success", sa.Boolean(), nullable=True),
        sa.Column("last_test_message", sa.Text(), nullable=True),
        sa.Column("disabled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint(
            "financial_entity_id",
            "integration_type",
            "name",
            name="uq_tenant_integration_name",
        ),
    )
    op.create_index(
        "ix_tenant_integrations_financial_entity_id",
        "tenant_integrations",
        ["financial_entity_id"],
    )
def downgrade() -> None:
    op.drop_index("ix_tenant_integrations_financial_entity_id", table_name="tenant_integrations")
    op.drop_table("tenant_integrations")
