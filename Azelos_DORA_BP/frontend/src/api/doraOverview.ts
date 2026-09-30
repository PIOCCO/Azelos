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
  incidents_total: number;
  incidents_open: number;
  incidents_major_open: number;
  resilience_tests_planned: number;
  tlpt_exercises_active: number;
  bcp_plans_active: number;
  drp_plans_active: number;
  overdue_remediations: number;
  evidence_expiring_within_30_days: number;
}

export function getDoraOverview() {
  return apiRequest<DoraOverview>("/api/v1/dora/overview");
}
