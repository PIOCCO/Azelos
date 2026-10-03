import { apiRequest } from "./client";

export interface PolicyStatusItem {
  key: string;
  version: string;
  title_en: string;
  title_fr: string;
  accepted: boolean;
}

export interface PolicyStatus {
  app_version: string;
  all_accepted: boolean;
  missing_policy_keys: string[];
  policies: PolicyStatusItem[];
}

export interface PolicyDocument {
  key: string;
  version: string;
  locale: string;
  title: string;
  content_markdown: string;
}

export function fetchPolicyStatus() {
  return apiRequest<PolicyStatus>("/api/v1/policies/status");
}

export function acceptPolicies() {
  return apiRequest<{ all_accepted: boolean; recorded_count: number }>("/api/v1/policies/accept", {
    method: "POST",
    body: JSON.stringify({ confirm: true }),
  });
}

export function fetchPolicyDocument(policyKey: string, locale: string) {
  const q = new URLSearchParams({ locale });
  return apiRequest<PolicyDocument>(`/api/v1/policies/documents/${policyKey}?${q}`);
}
