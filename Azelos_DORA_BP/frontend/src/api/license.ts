import { apiRequest } from "./client";

export interface LicenseStatus {
  validation_ok: boolean;
  access_mode: string;
  effective_status: string | null;
  license_id: string | null;
  organization_id: string;
  customer_name: string | null;
  plan: string | null;
  starts_at: string | null;
  expires_at: string | null;
  days_remaining: number | null;
  max_users: number | null;
  enabled_modules: string[] | null;
  warnings: string[];
  message: string | null;
  read_only: boolean;
  enforcement_enabled: boolean;
}

export function fetchLicenseStatus() {
  return apiRequest<LicenseStatus>("/api/v1/license/status/me");
}

export function fetchLicenseStatusAdmin() {
  return apiRequest<LicenseStatus>("/api/v1/license/status");
}

export function installLicense(envelope: unknown) {
  return apiRequest<LicenseStatus>("/api/v1/license/install", {
    method: "POST",
    body: JSON.stringify({ envelope }),
  });
}

export function replaceLicense(envelope: unknown) {
  return apiRequest<LicenseStatus>("/api/v1/license/replace", {
    method: "POST",
    body: JSON.stringify({ envelope }),
  });
}
