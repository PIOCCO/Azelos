from pydantic import BaseModel

from app.schemas.cloud_resilience import ResilienceDashboardOut


class DoraOverviewOut(BaseModel):
    """Operational resilience KPIs for the DORA overview dashboard."""

    resilience: ResilienceDashboardOut
    business_functions_total: int
    business_functions_critical: int
    ict_assets_total: int
    ict_assets_high_criticality: int
    ict_providers_total: int
    risk_assessments_total: int
    risk_assessments_high_or_critical: int
    evidence_items_total: int
    ict_services_critical: int
    incidents_module_available: bool
