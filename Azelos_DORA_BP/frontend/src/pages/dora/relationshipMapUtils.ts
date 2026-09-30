import type { Edge, Node } from "@xyflow/react";
import type { GraphEdge, GraphNode, EntityGraphResult } from "../../api/graphql";

export const TYPE_STYLES: Record<string, { border: string; bg: string }> = {
  BusinessFunction: { border: "border-blue-600", bg: "bg-blue-50" },
  ICTAsset: { border: "border-violet-600", bg: "bg-violet-50" },
  InformationAsset: { border: "border-indigo-500", bg: "bg-indigo-50" },
  ICTService: { border: "border-cyan-600", bg: "bg-cyan-50" },
  ICTProvider: { border: "border-amber-600", bg: "bg-amber-50" },
  Contract: { border: "border-orange-600", bg: "bg-orange-50" },
  RiskAssessment: { border: "border-red-600", bg: "bg-red-50" },
  Evidence: { border: "border-green-600", bg: "bg-green-50" },
  BusinessService: { border: "border-teal-600", bg: "bg-teal-50" },
  CloudResource: { border: "border-slate-600", bg: "bg-slate-50" },
  ResilienceFinding: { border: "border-rose-600", bg: "bg-rose-50" },
  RemediationAction: { border: "border-pink-600", bg: "bg-pink-50" },
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  SUPPORTS: "#2563eb",
  REALIZED_BY: "#6366f1",
  UNDER_CONTRACT: "#ea580c",
  PROVIDED_BY: "#d97706",
  ASSESSES: "#dc2626",
  DEFINES: "#7c3aed",
  EVIDENCED_BY: "#16a34a",
  SUB_OUTSOURCES: "#ca8a04",
  USES_RESOURCE: "#0891b2",
  DEPENDS_ON: "#0d9488",
  FINDING_ON: "#e11d48",
  REMEDIATES: "#db2777",
};

export const RELATIONSHIP_PRESETS: Record<
  string,
  { label: string; relationships: string[] }
> = {
  all: { label: "All relationships", relationships: [] },
  dependency: {
    label: "Dependencies",
    relationships: ["SUPPORTS", "REALIZED_BY", "DEPENDS_ON", "USES_RESOURCE"],
  },
  supplier: {
    label: "Supplier chain",
    relationships: ["PROVIDED_BY", "UNDER_CONTRACT", "SUB_OUTSOURCES"],
  },
  risk: { label: "Risk", relationships: ["ASSESSES"] },
  security: {
    label: "Security / controls",
    relationships: ["EVIDENCED_BY", "DEFINES", "ASSESSES"],
  },
  resilience: {
    label: "Resilience",
    relationships: ["FINDING_ON", "REMEDIATES", "DEPENDS_ON", "USES_RESOURCE"],
  },
};

export function mergeGraphs(a: EntityGraphResult, b: EntityGraphResult): EntityGraphResult {
  const nodes = new Map<string, GraphNode>();
  a.nodes.forEach((n) => nodes.set(n.id, n));
  b.nodes.forEach((n) => nodes.set(n.id, n));
  const edges = new Map<string, GraphEdge>();
  a.edges.forEach((e) => edges.set(e.id, e));
  b.edges.forEach((e) => edges.set(e.id, e));
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

export function relationshipTypesInGraph(edges: GraphEdge[]): string[] {
  return [...new Set(edges.map((e) => e.relationship))].sort();
}

export function applyGraphFilters(params: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hiddenRelationships: Set<string>;
  nodeTypes: Set<string>;
  sourceId: string;
  targetId: string;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  let edges = params.edges.filter((e) => !params.hiddenRelationships.has(e.relationship));
  if (params.sourceId) edges = edges.filter((e) => e.source === params.sourceId);
  if (params.targetId) edges = edges.filter((e) => e.target === params.targetId);

  const connected = new Set<string>();
  edges.forEach((e) => {
    connected.add(e.source);
    connected.add(e.target);
  });

  let nodes = params.nodes;
  if (params.nodeTypes.size > 0) {
    nodes = nodes.filter((n) => params.nodeTypes.has(n.type));
    const allowed = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => allowed.has(e.source) && allowed.has(e.target));
  } else if (edges.length > 0) {
    nodes = nodes.filter((n) => connected.has(n.id));
  }

  return { nodes, edges };
}

export function neighborSets(
  nodeId: string | null,
  edges: GraphEdge[],
): { nodes: Set<string>; edges: Set<string> } {
  const nodes = new Set<string>();
  const edgeIds = new Set<string>();
  if (!nodeId) return { nodes, edges: edgeIds };
  nodes.add(nodeId);
  edges.forEach((e) => {
    if (e.source === nodeId || e.target === nodeId) {
      nodes.add(e.source);
      nodes.add(e.target);
      edgeIds.add(e.id);
    }
  });
  return { nodes, edges: edgeIds };
}

export function layoutNodes(
  nodes: GraphNode[],
  edges: { source: string; target: string }[],
): Node[] {
  const depth = new Map<string, number>();
  const root = nodes[0]?.id;
  if (root) depth.set(root, 0);
  for (let i = 0; i < 12; i++) {
    for (const e of edges) {
      if (depth.has(e.source) && !depth.has(e.target)) {
        depth.set(e.target, (depth.get(e.source) ?? 0) + 1);
      }
      if (depth.has(e.target) && !depth.has(e.source)) {
        depth.set(e.source, (depth.get(e.target) ?? 0) + 1);
      }
    }
  }
  const byLevel = new Map<number, GraphNode[]>();
  for (const n of nodes) {
    const lv = depth.get(n.id) ?? 0;
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv)!.push(n);
  }
  const result: Node[] = [];
  for (const [lv, group] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
    group.forEach((n, idx) => {
      const style = TYPE_STYLES[n.type] ?? { border: "border-gray-400", bg: "bg-white" };
      result.push({
        id: n.id,
        position: { x: idx * 200, y: lv * 110 },
        data: { label: n.label, node: n },
        type: "default",
        style: {
          borderWidth: 2,
          borderRadius: 8,
          padding: 8,
          minWidth: 150,
          fontSize: 12,
        },
        className: `${style.border} ${style.bg}`,
      });
    });
  }
  return result;
}

export function toFlowEdges(
  edges: GraphEdge[],
  opts: {
    highlightEdgeId: string | null;
    highlightEdgeIds: Set<string>;
    hiddenRelationships: Set<string>;
    dimUnrelated: boolean;
    activeEdgeIds: Set<string>;
  },
): Edge[] {
  return edges
    .filter((e) => !opts.hiddenRelationships.has(e.relationship))
    .map((e) => {
      const color = RELATIONSHIP_COLORS[e.relationship] ?? "#64748b";
      const highlighted =
        e.id === opts.highlightEdgeId || opts.highlightEdgeIds.has(e.id);
      const dimmed = opts.dimUnrelated && !highlighted && !opts.activeEdgeIds.has(e.id);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.relationship,
        animated: e.relationship === "SUPPORTS" && !dimmed,
        style: {
          stroke: color,
          strokeWidth: highlighted ? 3 : 2,
          opacity: dimmed ? 0.15 : 1,
        },
        labelStyle: { fill: color, fontSize: 10, fontWeight: 600 },
      };
    });
}

export function toFlowNodes(
  flowLayout: Node[],
  opts: {
    highlightNodeIds: Set<string>;
    dimUnrelated: boolean;
    selectedId: string | null;
  },
): Node[] {
  return flowLayout.map((n) => {
    const highlighted = opts.highlightNodeIds.has(n.id) || n.id === opts.selectedId;
    const dimmed = opts.dimUnrelated && !highlighted;
    return {
      ...n,
      style: {
        ...n.style,
        opacity: dimmed ? 0.25 : 1,
        boxShadow: n.id === opts.selectedId ? "0 0 0 3px rgba(37,99,235,0.45)" : undefined,
      },
    };
  });
}

export function edgesForNode(nodeId: string, edges: GraphEdge[]) {
  const incoming = edges.filter((e) => e.target === nodeId);
  const outgoing = edges.filter((e) => e.source === nodeId);
  return { incoming, outgoing };
}
