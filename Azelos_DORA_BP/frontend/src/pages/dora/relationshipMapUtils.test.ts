import { describe, expect, it } from "vitest";
import {
  applyGraphFilters,
  applyPositionDeltaToNodes,
  mergeFlowNodePositions,
  mergeGraphs,
  nodeIdsIntersectingRect,
  normalizeSelectionRect,
  relationshipTypesInGraph,
  RELATIONSHIP_PRESETS,
} from "./relationshipMapUtils";
import type { Node } from "@xyflow/react";
import type { GraphEdge, GraphNode } from "../../api/graphql";

const n = (id: string, type: string): GraphNode => ({ id, type, label: id });
const e = (id: string, s: string, t: string, rel: string): GraphEdge => ({
  id,
  source: s,
  target: t,
  relationship: rel,
});

describe("relationshipMapUtils", () => {
  it("merges graphs without duplicate ids", () => {
    const a = { nodes: [n("A:1", "ICTAsset")], edges: [e("e1", "A:1", "B:2", "SUPPORTS")] };
    const b = { nodes: [n("A:1", "ICTAsset"), n("B:2", "ICTService")], edges: [e("e1", "A:1", "B:2", "SUPPORTS")] };
    const m = mergeGraphs(a, b);
    expect(m.nodes).toHaveLength(2);
    expect(m.edges).toHaveLength(1);
  });

  it("filters hidden relationship types", () => {
    const nodes = [n("A:1", "ICTAsset"), n("B:2", "BusinessFunction")];
    const edges = [e("e1", "A:1", "B:2", "SUPPORTS"), e("e2", "B:2", "A:1", "ASSESSES")];
    const out = applyGraphFilters({
      nodes,
      edges,
      hiddenRelationships: new Set(["ASSESSES"]),
      nodeTypes: new Set(),
      sourceId: "",
      targetId: "",
    });
    expect(out.edges).toHaveLength(1);
    expect(out.edges[0]!.relationship).toBe("SUPPORTS");
  });

  it("lists relationship types present in graph", () => {
    const types = relationshipTypesInGraph([
      e("1", "a", "b", "SUPPORTS"),
      e("2", "b", "c", "PROVIDED_BY"),
    ]);
    expect(types).toEqual(["PROVIDED_BY", "SUPPORTS"]);
  });

  it("prefers manual positions over auto layout", () => {
    const layout: Node[] = [
      { id: "a", position: { x: 0, y: 0 }, data: { label: "A" } },
      { id: "b", position: { x: 200, y: 0 }, data: { label: "B" } },
    ];
    const manual = new Map([["a", { x: 50, y: 80 }]]);
    const prev = new Map([["b", { x: 10, y: 20 }]]);
    const merged = mergeFlowNodePositions(layout, manual, prev);
    expect(merged[0]!.position).toEqual({ x: 50, y: 80 });
    expect(merged[1]!.position).toEqual({ x: 10, y: 20 });
  });

  it("presets reference known relationship enums", () => {
    for (const preset of Object.values(RELATIONSHIP_PRESETS)) {
      for (const rel of preset.relationships) {
        expect(rel).toMatch(/^[A-Z_]+$/);
      }
    }
  });

  it("normalizes marquee rectangles from any drag direction", () => {
    expect(normalizeSelectionRect({ x: 10, y: 20 }, { x: 30, y: 50 })).toEqual({
      x: 10,
      y: 20,
      width: 20,
      height: 30,
    });
    expect(normalizeSelectionRect({ x: 30, y: 50 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 20,
      height: 30,
    });
  });

  it("selects nodes whose bounds intersect the marquee", () => {
    const nodes = [
      { id: "a", position: { x: 0, y: 0 } },
      { id: "b", position: { x: 200, y: 0 } },
      { id: "c", position: { x: 40, y: 40 } },
    ];
    const rect = { x: 10, y: 10, width: 100, height: 100 };
    expect(nodeIdsIntersectingRect(nodes, rect).sort()).toEqual(["a", "c"]);
  });

  it("moves all selected nodes by the same delta", () => {
    const nodes = [
      { id: "a", position: { x: 0, y: 0 } },
      { id: "b", position: { x: 100, y: 0 } },
      { id: "c", position: { x: 0, y: 50 } },
    ];
    const moved = applyPositionDeltaToNodes(nodes, new Set(["a", "c"]), { dx: 10, dy: -5 });
    expect(moved.find((n) => n.id === "a")!.position).toEqual({ x: 10, y: -5 });
    expect(moved.find((n) => n.id === "b")!.position).toEqual({ x: 100, y: 0 });
    expect(moved.find((n) => n.id === "c")!.position).toEqual({ x: 10, y: 45 });
  });
});
