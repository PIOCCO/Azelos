import { getApiBase, getTokenProvider } from "./client";

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  metadata?: Record<string, unknown>;
}

export interface EntityGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const ENTITY_GRAPH_QUERY = `
query EntityGraph($entityType: EntityTypeGQL!, $entityId: ID!, $depth: Int!, $view: GraphViewGQL) {
  entityGraph(entityType: $entityType, entityId: $entityId, depth: $depth, view: $view) {
    nodes { id type label metadata }
    edges { id source target relationship metadata }
  }
}`;

const ORG_GRAPH_QUERY = `
query OrganizationGraph($depth: Int!, $maxNodes: Int!, $view: GraphViewGQL) {
  organizationGraph(depth: $depth, maxNodes: $maxNodes, view: $view) {
    nodes { id type label metadata }
    edges { id source target relationship metadata }
  }
}`;

const SEARCH_QUERY = `
query GraphSearch($query: String!, $limit: Int) {
  graphSearch(query: $query, limit: $limit) {
    id type label metadata
  }
}`;

/** Short, actionable message when the API DB schema is behind the app (migration 009). */
export function formatGraphQLError(message: string | undefined): string {
  const raw = message ?? "GraphQL error";
  if (
    raw.includes("risk_assessments.title") ||
    raw.includes("UndefinedColumn") ||
    raw.includes("risk_lifecycle")
  ) {
    return (
      "Database schema is out of date (missing risk assessment columns). " +
      "Restart the API after running: cd backend && python -m alembic upgrade head"
    );
  }
  return raw;
}

export async function fetchEntityGraph(params: {
  entityType: string;
  entityId: string;
  depth: number;
  view?: string;
}): Promise<EntityGraphResult> {
  const token = getTokenProvider()();
  const res = await fetch(`${getApiBase()}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query: ENTITY_GRAPH_QUERY,
      variables: {
        entityType: params.entityType,
        entityId: params.entityId,
        depth: params.depth,
        view: params.view ?? "ALL",
      },
    }),
  });
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(formatGraphQLError(body.errors[0].message));
  }
  return body.data.entityGraph;
}

export async function fetchOrganizationGraph(params: {
  depth?: number;
  maxNodes?: number;
  view?: string;
}): Promise<EntityGraphResult> {
  const token = getTokenProvider()();
  const res = await fetch(`${getApiBase()}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query: ORG_GRAPH_QUERY,
      variables: {
        depth: params.depth ?? 1,
        maxNodes: params.maxNodes ?? 80,
        view: params.view ?? "ALL",
      },
    }),
  });
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(formatGraphQLError(body.errors[0].message));
  }
  return body.data.organizationGraph;
}

export async function graphSearch(query: string, limit = 20): Promise<GraphNode[]> {
  const token = getTokenProvider()();
  const res = await fetch(`${getApiBase()}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { query, limit } }),
  });
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(formatGraphQLError(body.errors[0].message));
  }
  return body.data.graphSearch;
}

/** Map GraphQL entity type to REST detail route (uuid portion of node id). */
export function detailPathForNode(node: GraphNode): string | null {
  const uuid = node.id.includes(":") ? node.id.split(":")[1] : node.id;
  switch (node.type) {
    case "BusinessFunction":
      return `/business-functions`;
    case "ICTAsset":
      return `/ict-assets`;
    case "RiskAssessment":
      return `/risks/${uuid}`;
    case "ICTProvider":
      return `/ict-providers/${uuid}`;
    case "ICTIncident":
      return `/incidents/${uuid}`;
    case "ICTService":
      return `/ict-services`;
    case "Contract":
      return `/contracts`;
    case "BusinessService":
      return `/business-services`;
    case "ResilienceFinding":
      return `/findings`;
    default:
      return null;
  }
}

/** Map GraphQL node.type string to EntityTypeGQL variable value. */
export function graphNodeToEntityTypeGql(nodeType: string): string {
  const map: Record<string, string> = {
    BusinessFunction: "BUSINESS_FUNCTION",
    InformationAsset: "INFORMATION_ASSET",
    ICTAsset: "ICT_ASSET",
    ICTService: "ICT_SERVICE",
    ICTProvider: "ICT_PROVIDER",
    Contract: "CONTRACT",
    RiskAssessment: "RISK_ASSESSMENT",
    BusinessService: "BUSINESS_SERVICE",
    ResilienceFinding: "RESILIENCE_FINDING",
    ICTIncident: "ICT_INCIDENT",
  };
  return map[nodeType] ?? "ICT_ASSET";
}

export function graphNodeEntityUuid(node: GraphNode): string {
  return node.id.includes(":") ? node.id.split(":")[1]! : node.id;
}

export const GQL_ENTITY_TYPES = [
  { value: "BUSINESS_FUNCTION", label: "Business function" },
  { value: "ICT_ASSET", label: "ICT asset" },
  { value: "ICT_SERVICE", label: "ICT service" },
  { value: "ICT_PROVIDER", label: "ICT provider" },
  { value: "CONTRACT", label: "Contract" },
  { value: "RISK_ASSESSMENT", label: "Risk assessment" },
  { value: "BUSINESS_SERVICE", label: "Business service" },
  { value: "RESILIENCE_FINDING", label: "Resilience finding" },
] as const;
