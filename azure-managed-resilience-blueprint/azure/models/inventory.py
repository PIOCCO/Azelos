from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class NormalizedResource:
    azure_id: str
    name: str
    resource_type: str
    resource_group: str
    location: str
    health: str = "unknown"
    backup_protected: bool | None = None
    last_backup_at: datetime | None = None
    monthly_cost_usd: float | None = None
    cpu_avg: float | None = None


@dataclass
class NormalizedCostSummary:
    current_month_usd: float = 0.0
    forecast_usd: float | None = None
    budget_usd: float | None = None
    daily_yesterday: float | None = None
    daily_today: float | None = None
    by_service: dict[str, float] = field(default_factory=dict)


@dataclass
class NormalizedDrSummary:
    protected_vms: int = 0
    healthy: int = 0
    warning: int = 0
    critical: int = 0
    last_dr_test: str | None = None


@dataclass
class NormalizedSecuritySummary:
    counts: dict[str, int] = field(default_factory=dict)
    findings: list[dict] = field(default_factory=list)


@dataclass
class InventorySnapshot:
    subscription_id: str
    resources: list[NormalizedResource]
    costs: NormalizedCostSummary
    dr: NormalizedDrSummary
    security: NormalizedSecuritySummary
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
