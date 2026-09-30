import { apiRequest } from "./client";
import type { ResilienceDashboard } from "./resilience";

export interface DoraOverview {
  resilience: ResilienceDashboard;
  business_functions_total: number;
  business_functions_critical: number;
  ict_assets_total: number;
  ict_assets_high_criticality: number;
  ict_providers_total: number;
  risk_assessments_total: number;
  risk_assessments_high_or_critical: number;
  evidence_items_total: number;
  ict_services_critical: number;
  incidents_module_available: boolean;
}

export function getDoraOverview() {
  return apiRequest<DoraOverview>("/api/v1/dora/overview");
}
