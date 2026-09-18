import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class UserRole(str, enum.Enum):
    PROVIDER_ADMIN = "PROVIDER_ADMIN"
    CUSTOMER_ADMIN = "CUSTOMER_ADMIN"
    CUSTOMER_VIEWER = "CUSTOMER_VIEWER"
    OPERATOR = "OPERATOR"


class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class RecommendationStatus(str, enum.Enum):
    OPEN = "OPEN"
    APPROVED = "APPROVED"
    EXECUTED = "EXECUTED"
    DISMISSED = "DISMISSED"


class AuditAction(str, enum.Enum):
    USER_LOGIN = "USER_LOGIN"
    RESOURCE_DISCOVERED = "RESOURCE_DISCOVERED"
    BACKUP_CHECK = "BACKUP_CHECK"
    DR_CHECK = "DR_CHECK"
    SECURITY_CHECK = "SECURITY_CHECK"
    COST_CHECK = "COST_CHECK"
    RECOMMENDATION_CREATED = "RECOMMENDATION_CREATED"
    RECOMMENDATION_APPROVED = "RECOMMENDATION_APPROVED"
    ACTION_EXECUTED = "ACTION_EXECUTED"
    REPORT_GENERATED = "REPORT_GENERATED"


class Tenant(Base):
    __tablename__ = "tenants"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    azure_subscription_id: Mapped[str | None] = mapped_column(String(64), nullable=True)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("tenants.id"), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.PROVIDER_ADMIN)


class AzureResource(Base):
    __tablename__ = "azure_resources"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    azure_id: Mapped[str] = mapped_column(String(512), index=True)
    name: Mapped[str] = mapped_column(String(255))
    resource_type: Mapped[str] = mapped_column(String(128))
    resource_group: Mapped[str] = mapped_column(String(128))
    location: Mapped[str] = mapped_column(String(64))
    health_status: Mapped[str] = mapped_column(String(32), default="unknown")
    backup_protected: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    last_backup_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    dr_replication_health: Mapped[str | None] = mapped_column(String(32), nullable=True)
    monthly_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SecurityFinding(Base):
    __tablename__ = "security_findings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    severity: Mapped[str] = mapped_column(String(16))
    title: Mapped[str] = mapped_column(String(512))
    resource_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    evidence: Mapped[str] = mapped_column(Text)


class Recommendation(Base):
    __tablename__ = "recommendations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    resource_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    title: Mapped[str] = mapped_column(String(512))
    problem: Mapped[str] = mapped_column(Text)
    evidence: Mapped[str] = mapped_column(Text)
    suggested_action: Mapped[str] = mapped_column(Text)
    estimated_savings_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    priority: Mapped[str] = mapped_column(String(16))
    risk: Mapped[str] = mapped_column(String(32))
    status: Mapped[RecommendationStatus] = mapped_column(Enum(RecommendationStatus), default=RecommendationStatus.OPEN)


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    severity: Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity))
    title: Mapped[str] = mapped_column(String(512))
    message: Mapped[str] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class CostSnapshot(Base):
    __tablename__ = "cost_snapshots"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    period: Mapped[str] = mapped_column(String(32))
    amount_usd: Mapped[float] = mapped_column(Float)
    forecast_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    budget_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action: Mapped[AuditAction] = mapped_column(Enum(AuditAction))
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RecoveryObjective(Base):
    __tablename__ = "recovery_objectives"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    resource_key: Mapped[str] = mapped_column(String(128))
    criticality: Mapped[str] = mapped_column(String(32))
    rpo_minutes: Mapped[int] = mapped_column(Integer)
    rto_minutes: Mapped[int] = mapped_column(Integer)
    priority: Mapped[int] = mapped_column(Integer, default=1)


class DrSnapshot(Base):
    __tablename__ = "dr_snapshots"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    protected_vms: Mapped[int] = mapped_column(Integer, default=0)
    healthy: Mapped[int] = mapped_column(Integer, default=0)
    warning: Mapped[int] = mapped_column(Integer, default=0)
    critical: Mapped[int] = mapped_column(Integer, default=0)
    last_dr_test: Mapped[str | None] = mapped_column(String(32), nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MonthlyReport(Base):
    __tablename__ = "monthly_reports"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    period: Mapped[str] = mapped_column(String(32))
    body_markdown: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
