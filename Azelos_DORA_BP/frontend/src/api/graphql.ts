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

const SEARCH_QUERY = `
query GraphSearch($query: String!, $limit: Int) {
  graphSearch(query: $query, limit: $limit) {
    id type label metadata
  }
}`;

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
    throw new Error(body.errors[0].message ?? "GraphQL error");
  }
  return body.data.entityGraph;
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
    throw new Error(body.errors[0].message ?? "GraphQL error");
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
      return `/ict-providers`;
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
