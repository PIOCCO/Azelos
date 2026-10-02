"""Add integration config audit enum values

Revision ID: 012_integration_audit_enum
Revises: 011_tenant_integrations
"""

from typing import Sequence, Union

from alembic import op

revision: str = "012_integration_audit_enum"
down_revision: Union[str, None] = "011_tenant_integrations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for value in (
        "INTEGRATION_CREATED",
        "INTEGRATION_MODIFIED",
        "INTEGRATION_TESTED",
        "INTEGRATION_DISABLED",
    ):
        op.execute(f"ALTER TYPE config_audit_action ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    pass
