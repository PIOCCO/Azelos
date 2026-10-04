"""Organization software licenses (customer-hosted deployments)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "014_organization_licenses"
down_revision = "013_user_policy_acceptances"
branch_labels = None
depends_on = None


def upgrade() -> None:
    license_plan = postgresql.ENUM(
        "PILOT",
        "ANNUAL",
        "INTERNAL",
        name="license_plan",
        create_type=False,
    )
    license_status = postgresql.ENUM(
        "ACTIVE",
        "EXPIRING",
        "EXPIRED",
        "SUSPENDED",
        "REVOKED",
        name="license_status",
        create_type=False,
    )
    bind = op.get_bind()
    license_plan.create(bind, checkfirst=True)
    license_status.create(bind, checkfirst=True)

    op.create_table(
        "organization_licenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "financial_entity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("financial_entities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("license_id", sa.String(36), nullable=False),
        sa.Column("customer_name", sa.String(256), nullable=False),
        sa.Column("plan", license_plan, nullable=False),
        sa.Column("license_status", license_status, nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("max_users", sa.Integer(), nullable=False),
        sa.Column("enabled_modules", postgresql.JSONB(), nullable=True),
        sa.Column("product_version", sa.String(64), nullable=True),
        sa.Column("envelope_json", postgresql.JSONB(), nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=False),
        sa.Column(
            "installed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("installed_by", sa.String(320), nullable=True),
        sa.Column("last_validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
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
        sa.UniqueConstraint("financial_entity_id", name="uq_org_license_entity"),
        sa.UniqueConstraint("license_id", name="uq_org_license_license_id"),
    )
    op.create_index("ix_org_licenses_expires_at", "organization_licenses", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_org_licenses_expires_at", table_name="organization_licenses")
    op.drop_table("organization_licenses")
    op.execute("DROP TYPE IF EXISTS license_status")
    op.execute("DROP TYPE IF EXISTS license_plan")
