import { ApiError, apiRequest } from "./client";
import type {
  ApplicabilityResult,
  AssetFunctionMap,
  BusinessFunction,
  ConfigModule,
  Contract,
  CustomField,
  Evidence,
  ICTAsset,
  ICTService,
  InformationAsset,
  LoginResponse,
  OrganizationProfile,
  OrganizationRequirement,
  Paginated,
  RegulatoryRequirement,
  Risk,
  SubOutsourcing,
  Supplier,
} from "./types";

export function login(email: string, password: string, organizationId?: string) {
  return apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, organization_id: organizationId ?? null }),
  });
}

export interface LoginOptions {
  oidc_enabled: boolean;
  oidc_client_id: string | null;
  oidc_issuer_url: string | null;
}

export function getLoginOptions() {
  return apiRequest<LoginOptions>("/api/v1/auth/login-options");
}

export function loginWithOidcIdToken(idToken: string, organizationId?: string) {
  return apiRequest<LoginResponse>("/api/v1/auth/oidc/token", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken, organization_id: organizationId ?? null }),
  });
}

export function getOrganization(orgId: string) {
  return apiRequest<{ id: string; legal_name: string; short_name: string | null }>(
    `/api/v1/organizations/${orgId}`,
  );
}

export function getProfile(orgId: string) {
  return apiRequest<OrganizationProfile>(`/api/v1/organizations/${orgId}/profile`);
}

export function patchProfile(orgId: string, data: Partial<OrganizationProfile>) {
  return apiRequest<OrganizationProfile>(`/api/v1/organizations/${orgId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getApplicability(orgId: string) {
  return apiRequest<ApplicabilityResult>(`/api/v1/organizations/${orgId}/applicability`);
}

export function getOrgModules(orgId: string) {
  return apiRequest<ApplicabilityResult["modules"]>(
    `/api/v1/organizations/${orgId}/modules`,
  );
}

export function listRegulatoryRequirements() {
  return apiRequest<RegulatoryRequirement[]>("/api/v1/regulatory-requirements");
}

export function listOrgRequirements(orgId: string) {
  return apiRequest<OrganizationRequirement[]>(
    `/api/v1/organizations/${orgId}/requirements`,
  );
}

export function patchOrgRequirement(
  orgId: string,
  orgRequirementId: string,
  data: Partial<Pick<OrganizationRequirement, "applicable" | "implementation_status" | "owner" | "notes">>,
) {
  return apiRequest<OrganizationRequirement>(
    `/api/v1/organizations/${orgId}/requirements/${orgRequirementId}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
}

export function linkEvidenceToRequirement(evidenceId: string, organizationRequirementId: string) {
  return apiRequest<{ id: string }>("/api/v1/evidence-links/requirements", {
    method: "POST",
    body: JSON.stringify({ evidence_id: evidenceId, organization_requirement_id: organizationRequirementId }),
  });
}

export async function uploadRequirementEvidence(
  organizationId: string,
  organizationRequirementId: string,
  file: File,
) {
  const form = new FormData();
  form.append("file", file);
  const token = (await import("./client")).getTokenProvider()();
  const base = (await import("./client")).getApiBase();
  const res = await fetch(
    `${base}/api/v1/organizations/${organizationId}/requirements/${organizationRequirementId}/evidence`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }
  return res.json() as Promise<Evidence>;
}

export async function downloadDoraAssessmentPdf(): Promise<void> {
  const token = (await import("./client")).getTokenProvider()();
  const base = (await import("./client")).getApiBase();
  const res = await fetch(`${base}/api/v1/export/dora-assessment.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("PDF export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dora-assessment.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

export function linkFunctionService(businessFunctionId: string, ictServiceId: string) {
  return apiRequest<{ id: string; function_id: string; service_id: string }>(
    "/api/v1/dependencies/function-service",
    {
      method: "POST",
      body: JSON.stringify({
        business_function_id: businessFunctionId,
        ict_service_id: ictServiceId,
      }),
    },
  );
}

export function patchContractControl(
  controlId: string,
  data: { compliance_status: string; notes?: string },
) {
  return apiRequest<{ id: string; compliance_status: string }>(
    `/api/v1/controls/contract-controls/${controlId}`,
    { method: "PATCH", body: JSON.stringify(data) },
  );
}

export function inviteMember(email: string, role: string) {
  return apiRequest<{ invitation_id: string; invite_token: string }>(
    "/api/v1/memberships/invitations",
    { method: "POST", body: JSON.stringify({ email, role }) },
  );
}

export function acceptInvitation(token: string, password: string, fullName?: string) {
  return apiRequest<LoginResponse>("/api/v1/memberships/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ token, password, full_name: fullName ?? null }),
  });
}

export function listBia() {
  return apiRequest<
    {
      id: string;
      business_function_id: string;
      rto_hours: number | null;
      rpo_hours: number | null;
      impact_summary: string | null;
    }[]
  >("/api/v1/bia");
}

export function createBia(body: {
  business_function_id: string;
  rto_hours?: number;
  rpo_hours?: number;
  impact_summary?: string;
}) {
  return apiRequest<unknown>("/api/v1/bia", { method: "POST", body: JSON.stringify(body) });
}

export async function uploadEvidenceFile(
  file: File,
  documentTypeId: string,
  providerId?: string,
  contractId?: string,
) {
  const form = new FormData();
  form.append("file", file);
  form.append("document_type_id", documentTypeId);
  if (providerId) form.append("provider_id", providerId);
  if (contractId) form.append("contract_id", contractId);
  const token = (await import("./client")).getTokenProvider()();
  const base = (await import("./client")).getApiBase();
  const res = await fetch(`${base}/api/v1/evidence/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }
  return res.json() as Promise<Evidence>;
}

export interface DocumentTypeOption {
  id: string;
  code: string;
  label: string;
}

export function listDocumentTypes() {
  return apiRequest<DocumentTypeOption[]>("/api/v1/evidence/document-types");
}

export function fetchPaginated<T>(
  path: string,
  page = 1,
  pageSize = 20,
  search?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search?.trim()) params.set("q", search.trim());
  return apiRequest<Paginated<T>>(`${path}?${params.toString()}`);
}

export function listConfigModules() {
  return apiRequest<ConfigModule[]>("/api/v1/config/modules");
}

export function setConfigModule(moduleKey: string, enabled: boolean) {
  return apiRequest<ConfigModule>(`/api/v1/config/modules/${moduleKey}`, {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

export function listCustomFields(entityType?: string) {
  const q = entityType ? `?entity_type=${encodeURIComponent(entityType)}` : "";
  return apiRequest<CustomField[]>(`/api/v1/config/custom-fields${q}`);
}

export function createCustomField(body: {
  entity_type: string;
  field_key: string;
  display_name: string;
  field_type: string;
  required?: boolean;
  options?: string[];
}) {
  return apiRequest<CustomField>("/api/v1/config/custom-fields", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createBusinessFunction(body: {
  name: string;
  function_identifier: string;
  critical_or_important: string;
  description?: string;
}) {
  return apiRequest<BusinessFunction>("/api/v1/business-functions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createICTAsset(body: {
  name: string;
  asset_identifier: string;
  inherent_criticality: string;
  information_asset_id?: string;
}) {
  return apiRequest<ICTAsset>("/api/v1/ict-assets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createAssetFunctionMap(body: {
  function_id: string;
  ict_asset_id: string;
  supports_critical_function: boolean;
}) {
  return apiRequest<AssetFunctionMap>("/api/v1/asset-function-maps", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listContractControls() {
  return apiRequest<
    { id: string; contract_id: string; control_definition_id: string; compliance_status: string }[]
  >("/api/v1/controls");
}

export function listControlDefinitions() {
  return apiRequest<{ id: string; code: string; title: string; description: string | null }[]>(
    "/api/v1/controls/definitions",
  );
}

export function createProvider(body: {
  legal_name: string;
  country_code: string;
  trading_name?: string;
  lei?: string;
}) {
  return apiRequest<Supplier>("/api/v1/ict-providers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createContract(body: {
  provider_id: string;
  reference_number: string;
  start_date: string;
  end_date?: string | null;
  contract_type?: string;
}) {
  return apiRequest<Contract>("/api/v1/contracts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchContract(
  contractId: string,
  body: Partial<{ status: string; end_date: string | null; governing_law: string | null }>,
) {
  return apiRequest<Contract>(`/api/v1/contracts/${contractId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function createIctService(body: {
  contract_id: string;
  name: string;
  description?: string | null;
  supports_critical_or_important?: string;
}) {
  return apiRequest<ICTService>("/api/v1/ict-services", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchIctService(
  serviceId: string,
  body: Partial<{ name: string; description: string | null; status: string }>,
) {
  return apiRequest<ICTService>(`/api/v1/ict-services/${serviceId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function createSubOutsourcing(body: {
  provider_id: string;
  legal_name: string;
  country_code: string;
  lei?: string | null;
  service_description?: string | null;
  parent_subcontractor_id?: string | null;
}) {
  return apiRequest<SubOutsourcing>("/api/v1/sub-outsourcing", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchSubOutsourcing(
  id: string,
  body: Partial<{ legal_name: string; status: string; service_description: string | null }>,
) {
  return apiRequest<SubOutsourcing>(`/api/v1/sub-outsourcing/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function provisionTenant(body: {
  legal_name: string;
  country_code: string;
  admin_email: string;
  admin_password: string;
  short_name?: string;
  lei?: string;
}) {
  return apiRequest<LoginResponse & { organization: { id: string; legal_name: string } }>(
    "/api/v1/tenant/provision",
    { method: "POST", body: JSON.stringify(body) },
  );
}

/** Stub list endpoints return 501 when not implemented. */
export async function probeStubEndpoint(path: string): Promise<{ ok: boolean; message: string }> {
  try {
    await apiRequest<unknown>(path);
    return { ok: true, message: "Available" };
  } catch (e) {
    if (e instanceof ApiError && e.status === 501) {
      return { ok: false, message: e.message ?? "Not implemented on server" };
    }
    throw e;
  }
}

export type EntityPaths = {
  businessFunctions: "/api/v1/business-functions";
  informationAssets: "/api/v1/information-assets";
  ictAssets: "/api/v1/ict-assets";
  providers: "/api/v1/ict-providers";
  contracts: "/api/v1/contracts";
  ictServices: "/api/v1/ict-services";
  subOutsourcing: "/api/v1/sub-outsourcing";
  risks: "/api/v1/risks";
  controls: "/api/v1/controls";
  evidence: "/api/v1/evidence";
};

export type {
  BusinessFunction,
  Contract,
  Evidence,
  ICTAsset,
  ICTService,
  InformationAsset,
  Risk,
  SubOutsourcing,
  Supplier,
};
