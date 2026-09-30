import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.rbac import Role
from app.database.base import Base
from app.models.db_types import pg_enum
from app.models.enums_saas import SubscriptionStatus
from app.models.mixins import TimestampMixin

subscription_status_enum = pg_enum(SubscriptionStatus, "subscription_status")
role_enum = pg_enum(Role, "user_role", create_type=False)


class OrganizationSubscription(Base, TimestampMixin):
    __tablename__ = "organization_subscriptions"
    __table_args__ = (
        UniqueConstraint("financial_entity_id", name="uq_org_subscription_entity"),
        Index("ix_org_subscriptions_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    plan_key: Mapped[str] = mapped_column(String(64), nullable=False, default="standard")
    status: Mapped[SubscriptionStatus] = mapped_column(
        subscription_status_enum, nullable=False, default=SubscriptionStatus.TRIAL
    )
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class UserInvitation(Base, TimestampMixin):
    __tablename__ = "user_invitations"
    __table_args__ = (
        Index("ix_user_invitations_token_hash", "token_hash", unique=True),
        Index("ix_user_invitations_org_email", "financial_entity_id", "email"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    financial_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("financial_entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    role: Mapped[Role] = mapped_column(role_enum, nullable=False, default=Role.USER)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    invited_by: Mapped[str | None] = mapped_column(String(320))
