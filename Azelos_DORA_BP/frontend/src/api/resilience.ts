import { apiRequest } from "./client";
import { fetchPaginated } from "./dora";

export interface ResilienceDashboard {
  critical_business_services: number;
  services_with_gaps: number;
  high_findings: number;
  open_findings: number;
  open_remediations: number;
  cloud_resources: number;
  recovery_tests_passed: number;
  recovery_tests_failed: number;
  recovery_tests_not_run: number;
  dora_implemented: number;
  dora_partial: number;
  dora_not_implemented: number;
  dora_insufficient_evidence: number;
  dora_not_assessed: number;
}

export interface BusinessService {
  id: string;
  name: string;
  criticality: string;
  status: string;
  rto_minutes: number | null;
  rpo_minutes: number | null;
  measured_recovery_minutes: number | null;
  measured_data_loss_minutes: number | null;
  rto_gap_minutes: number | null;
  rpo_gap_minutes: number | null;
}

export interface CloudAccount {
  id: string;
  display_name: string;
  provider: string;
  subscription_id: string;
  last_discovery_status: string | null;
}

export interface CloudResource {
  id: string;
  name: string;
  resource_type: string;
  region: string | null;
  business_service_id: string | null;
  provenance: string;
  last_discovered_at: string | null;
}

export interface ResilienceFinding {
  id: string;
  title: string;
  severity: string;
  status: string;
}

export function getResilienceDashboard() {
  return apiRequest<ResilienceDashboard>("/api/v1/resilience/dashboard");
}

export function listBusinessServices(page = 1) {
  return fetchPaginated<BusinessService>("/api/v1/business-services", page, 50);
}

export function listCloudAccounts(page = 1) {
  return fetchPaginated<CloudAccount>("/api/v1/cloud-accounts", page, 50);
}

export function listCloudResources(page = 1) {
  return fetchPaginated<CloudResource>("/api/v1/cloud-resources", page, 50);
}

export function listFindings(page = 1) {
  return fetchPaginated<ResilienceFinding>("/api/v1/resilience/findings", page, 50);
}
