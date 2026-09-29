/** Types aligned with FastAPI OpenAPI (app.main) — update when API changes. */

export type Role =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "RISK_MANAGER"
  | "SECURITY_MANAGER"
  | "BUSINESS_CONTINUITY_MANAGER"
  | "AUDITOR"
  | "USER";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  organization_id: string;
  role: Role;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface OrganizationProfile {
  id: string;
  financial_entity_id: string;
  organization_type: string;
  size_category: string;
  regulatory_status: string;
  art16_eligible: boolean;
  has_critical_functions: boolean;
  tlpt_applicable: boolean;
}

export interface BusinessFunction {
  id: string;
  name: string;
  function_identifier: string;
  critical_or_important: string;
  status: string;
}

export interface InformationAsset {
  id: string;
  name: string;
  asset_identifier: string;
  description: string | null;
}

export interface ICTAsset {
  id: string;
  name: string;
  asset_identifier: string;
  inherent_criticality: string;
  information_asset_id: string | null;
}

export interface Supplier {
  id: string;
  legal_name: string;
  trading_name: string | null;
  lei: string | null;
  country_code: string;
}

export interface Contract {
  id: string;
  reference_number: string;
  provider_id: string;
  contract_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
}

export interface ICTService {
  id: string;
  name: string;
  contract_id: string;
  status: string;
  supports_critical_or_important: string;
}

export interface SubOutsourcing {
  id: string;
  provider_id: string;
  legal_name: string;
  country_code: string;
  depth_rank: number;
  status: string;
}

export interface Risk {
  id: string;
  provider_id: string | null;
  resulting_risk_level: string;
  calculated_at: string;
  assessor: string;
}

export interface ControlDefinition {
  id: string;
  control_code: string;
  title: string;
}

export interface Evidence {
  id: string;
  file_name: string;
  storage_provider: string;
  uploaded_at: string;
}

export interface ConfigModule {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
}

export interface CustomField {
  id: string;
  entity_type: string;
  field_key: string;
  display_name: string;
  field_type: string;
  required: boolean;
  options: string[] | null;
  active: boolean;
}

export interface AssetFunctionMap {
  id: string;
  function_id: string;
  ict_asset_id: string;
  supports_critical_function: boolean;
}

export interface ModuleApplicability {
  key: string;
  name: string;
  description: string | null;
  available: boolean;
  enabled: boolean;
  applicable: boolean;
  required: boolean;
  disabled: boolean;
}

export interface ApplicabilityResult {
  organization_id: string;
  features: Record<string, boolean>;
  modules: ModuleApplicability[];
  rules: string[];
  requirements_hint: string[];
}

export interface RegulatoryRequirement {
  id: string;
  code: string;
  title: string;
  description: string | null;
}

export interface OrganizationRequirement {
  id: string;
  dora_requirement_id: string;
  code: string;
  title: string;
  applicable: boolean;
  implementation_status: string;
  owner: string | null;
  notes: string | null;
}

export interface ApiErrorBody {
  error?: { code: string; message: string };
  detail?: string | { msg: string; loc: string[] }[];
}
