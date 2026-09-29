/** Profile enum values from backend OrganizationType / size / status (OpenAPI). */
export const ORGANIZATION_TYPES = [
  "credit_institution",
  "payment_institution",
  "e_money_institution",
  "investment_firm",
  "insurance_undertaking",
  "reinsurance_undertaking",
  "casp",
  "other_financial_entity",
] as const;

export const SIZE_CATEGORIES = ["small", "medium", "large", "group"] as const;

export const REGULATORY_STATUSES = ["authorized", "passporting", "pending", "other"] as const;

export function labelEnum(value: string): string {
  return value.replace(/_/g, " ");
}
