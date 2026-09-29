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

export function fetchPaginated<T>(path: string, page = 1, pageSize = 20) {
  const q = `?page=${page}&page_size=${pageSize}`;
  return apiRequest<Paginated<T>>(`${path}${q}`);
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
