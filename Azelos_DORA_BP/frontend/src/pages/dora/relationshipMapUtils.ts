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

/** Apply user/session positions over auto-layout; layout is used only when no saved position exists. */
export function mergeFlowNodePositions(
  nextNodes: Node[],
  manualPositions: ReadonlyMap<string, { x: number; y: number }>,
  previousPositions: ReadonlyMap<string, { x: number; y: number }>,
): Node[] {
  return nextNodes.map((n) => {
    const manual = manualPositions.get(n.id);
    if (manual) return { ...n, position: { x: manual.x, y: manual.y } };
    const prev = previousPositions.get(n.id);
    if (prev) return { ...n, position: { x: prev.x, y: prev.y } };
    return n;
  });
}

export const DEFAULT_NODE_WIDTH = 150;
export const DEFAULT_NODE_HEIGHT = 52;

export function areSelectionSetsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

export type AxisRect = { x: number; y: number; width: number; height: number };

/** Normalize a drag rectangle (any corner start) to positive width/height. */
export function normalizeSelectionRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
): AxisRect {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return { x, y, width, height };
}

export function axisRectsIntersect(a: AxisRect, b: AxisRect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function nodeAxisBounds(node: {
  position: { x: number; y: number };
  width?: number;
  height?: number;
}): AxisRect {
  const width = node.width ?? DEFAULT_NODE_WIDTH;
  const height = node.height ?? DEFAULT_NODE_HEIGHT;
  return { x: node.position.x, y: node.position.y, width, height };
}

/** Select visible nodes whose bounding box intersects the marquee (flow coordinates). */
export function nodeIdsIntersectingRect(
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    width?: number;
    height?: number;
  }>,
  rect: AxisRect,
): string[] {
  if (rect.width < 1 && rect.height < 1) return [];
  return nodes
    .filter((n) => axisRectsIntersect(nodeAxisBounds(n), rect))
    .map((n) => n.id);
}

/** Apply the same drag delta to every selected node (layout-only). */
export function applyPositionDeltaToNodes(
  nodes: Array<{ id: string; position: { x: number; y: number } }>,
  selectedIds: ReadonlySet<string>,
  delta: { dx: number; dy: number },
): Array<{ id: string; position: { x: number; y: number } }> {
  if (delta.dx === 0 && delta.dy === 0) return nodes;
  return nodes.map((n) => {
    if (!selectedIds.has(n.id)) return n;
    return {
      ...n,
      position: { x: n.position.x + delta.dx, y: n.position.y + delta.dy },
    };
  });
}

export function toFlowNodes(
  flowLayout: Node[],
  opts: {
    highlightNodeIds: Set<string>;
    dimUnrelated: boolean;
    selectedIds: ReadonlySet<string>;
    focusedId: string | null;
  },
): Node[] {
  return flowLayout.map((n) => {
    const isCanvasSelected = opts.selectedIds.has(n.id);
    const isFocused = opts.focusedId === n.id;
    const highlighted =
      opts.highlightNodeIds.has(n.id) || isCanvasSelected || isFocused;
    const dimmed = opts.dimUnrelated && !highlighted;
    const selectionRing = isCanvasSelected
      ? "0 0 0 2px rgba(37,99,235,0.85), 0 0 0 4px rgba(37,99,235,0.25)"
      : undefined;
    const focusRing = isFocused
      ? "0 0 0 2px rgba(15,23,42,0.9), 0 0 0 5px rgba(37,99,235,0.35)"
      : undefined;
    return {
      ...n,
      selected: isCanvasSelected,
      style: {
        ...n.style,
        opacity: dimmed ? 0.25 : 1,
        borderWidth: isCanvasSelected ? 3 : n.style?.borderWidth ?? 2,
        boxShadow: focusRing ?? selectionRing,
      },
      className: [
        n.className,
        isCanvasSelected ? "relationship-map-node--selected" : "",
        isFocused ? "relationship-map-node--focused" : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  });
}

export function edgesForNode(nodeId: string, edges: GraphEdge[]) {
  const incoming = edges.filter((e) => e.target === nodeId);
  const outgoing = edges.filter((e) => e.source === nodeId);
  return { incoming, outgoing };
}
