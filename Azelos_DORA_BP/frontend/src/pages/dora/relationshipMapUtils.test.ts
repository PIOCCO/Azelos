import { describe, expect, it } from "vitest";
import {
  applyGraphFilters,
  mergeFlowNodePositions,
  mergeGraphs,
  relationshipTypesInGraph,
  RELATIONSHIP_PRESETS,
  toFlowNodes,
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

  it("toFlowNodes keeps x/y when selection highlight changes", () => {
    const nodes: Node[] = [
      { id: "a", position: { x: 111, y: 222 }, data: { label: "A" } },
      { id: "b", position: { x: 333, y: 444 }, data: { label: "B" } },
    ];
    const styled = toFlowNodes(nodes, {
      highlightNodeIds: new Set(["a"]),
      dimUnrelated: true,
      selectedId: "a",
    });
    expect(styled[0]!.position).toEqual({ x: 111, y: 222 });
    expect(styled[1]!.position).toEqual({ x: 333, y: 444 });
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
});
