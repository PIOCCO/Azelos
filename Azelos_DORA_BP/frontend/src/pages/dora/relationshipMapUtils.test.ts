import { describe, expect, it } from "vitest";
import {
  applyGraphFilters,
  mergeGraphs,
  relationshipTypesInGraph,
  RELATIONSHIP_PRESETS,
} from "./relationshipMapUtils";
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

  it("presets reference known relationship enums", () => {
    for (const preset of Object.values(RELATIONSHIP_PRESETS)) {
      for (const rel of preset.relationships) {
        expect(rel).toMatch(/^[A-Z_]+$/);
      }
    }
  });
});
