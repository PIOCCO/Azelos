import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.schemas_pg import CLIENT_EXTENSIONS_SCHEMA
from app.database.base import Base
from app.models.mixins import TimestampMixin


class ExtensionRegistration(Base, TimestampMixin):
    """Metadata for customer-managed client_extensions (no arbitrary SQL)."""

    __tablename__ = "extension_registrations"
    __table_args__ = {"schema": CLIENT_EXTENSIONS_SCHEMA}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    version: Mapped[str | None] = mapped_column(String(64))
    owner: Mapped[str | None] = mapped_column(String(256))
    status: Mapped[str] = mapped_column(String(32), default="registered", nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String(64))
