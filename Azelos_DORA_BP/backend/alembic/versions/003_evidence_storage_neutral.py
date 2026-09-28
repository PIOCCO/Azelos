"""Evidence storage-neutral columns; rename sha256_hash to content_hash.

Revision ID: 003_evidence_storage_neutral
Revises: 002_reference_data
Create Date: 2026-09-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003_evidence_storage_neutral"
down_revision: Union[str, None] = "002_reference_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "evidence",
        sa.Column("storage_provider", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "evidence",
        sa.Column("storage_object_key", sa.String(length=2048), nullable=True),
    )
    op.add_column(
        "evidence",
        sa.Column("content_type", sa.String(length=256), nullable=True),
    )
    op.add_column(
        "evidence",
        sa.Column("size_bytes", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "evidence",
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    op.alter_column("evidence", "blob_uri", existing_type=sa.String(length=2048), nullable=True)

    op.execute(
        """
        UPDATE evidence
        SET storage_provider = COALESCE(storage_provider, 'legacy_uri'),
            storage_object_key = COALESCE(storage_object_key, blob_uri, file_name)
        WHERE storage_object_key IS NULL
        """
    )

    op.alter_column("evidence", "storage_provider", nullable=False)
    op.alter_column("evidence", "storage_object_key", nullable=False)

    op.alter_column("evidence", "sha256_hash", new_column_name="content_hash")

    op.create_index(
        "ix_evidence_storage_provider",
        "evidence",
        ["storage_provider"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_evidence_storage_provider", table_name="evidence")
    op.alter_column("evidence", "content_hash", new_column_name="sha256_hash")
    op.drop_column("evidence", "metadata")
    op.drop_column("evidence", "size_bytes")
    op.drop_column("evidence", "content_type")
    op.drop_column("evidence", "storage_object_key")
    op.drop_column("evidence", "storage_provider")
    op.alter_column("evidence", "blob_uri", existing_type=sa.String(length=2048), nullable=False)
