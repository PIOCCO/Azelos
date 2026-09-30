import { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMutation } from "@tanstack/react-query";
import {
  GQL_ENTITY_TYPES,
  detailPathForNode,
  fetchEntityGraph,
  graphSearch,
  type GraphNode,
} from "../../api/graphql";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { Link } from "react-router-dom";

const TYPE_STYLES: Record<string, { border: string; bg: string }> = {
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

function layoutNodes(nodes: GraphNode[], edges: { source: string; target: string }[]): Node[] {
  const depth = new Map<string, number>();
  const root = nodes[0]?.id;
  if (root) depth.set(root, 0);
  for (let i = 0; i < 8; i++) {
    for (const e of edges) {
      if (depth.has(e.source) && !depth.has(e.target)) depth.set(e.target, (depth.get(e.source) ?? 0) + 1);
      if (depth.has(e.target) && !depth.has(e.source)) depth.set(e.source, (depth.get(e.target) ?? 0) + 1);
    }
  }
  const byLevel = new Map<number, GraphNode[]>();
  for (const n of nodes) {
    const lv = depth.get(n.id) ?? 0;
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv)!.push(n);
  }
  const result: Node[] = [];
  for (const [lv, group] of byLevel) {
    group.forEach((n, idx) => {
      const style = TYPE_STYLES[n.type] ?? { border: "border-gray-400", bg: "bg-white" };
      result.push({
        id: n.id,
        position: { x: idx * 220, y: lv * 120 },
        data: { label: n.label, node: n },
        type: "default",
        style: {
          borderWidth: 2,
          borderRadius: 8,
          padding: 8,
          minWidth: 160,
          fontSize: 12,
        },
        className: `${style.border} ${style.bg}`,
      });
    });
  }
  return result;
}

export function RelationshipMapPage() {
  const [search, setSearch] = useState("");
  const [depth, setDepth] = useState(2);
  const [view, setView] = useState<"ALL" | "RISK" | "RESILIENCE">("ALL");
  const [entityType, setEntityType] = useState<string>("ICT_ASSET");
  const [entityId, setEntityId] = useState("");
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [relFilter, setRelFilter] = useState<string>("");

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const loadGraph = useMutation({
    mutationFn: () =>
      fetchEntityGraph({
        entityType,
        entityId,
        depth,
        view,
      }),
    onSuccess: (data) => {
      let fnodes = data.nodes;
      let fedges = data.edges;
      if (typeFilter) fnodes = fnodes.filter((n) => n.type === typeFilter);
      if (relFilter) fedges = fedges.filter((e) => e.relationship === relFilter);
      const allowed = new Set(fnodes.map((n) => n.id));
      fedges = fedges.filter((e) => allowed.has(e.source) && allowed.has(e.target));
      setNodes(layoutNodes(fnodes, fedges));
      setEdges(
        fedges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.relationship,
          animated: e.relationship === "SUPPORTS",
        })),
      );
      setSelected(fnodes[0] ?? null);
    },
  });

  const searchMut = useMutation({
    mutationFn: () => graphSearch(search, 15),
  });

  const legend = useMemo(
    () => Object.keys(TYPE_STYLES).sort(),
    [],
  );

  const onPickSearchResult = useCallback((n: GraphNode) => {
    const enumVal =
      GQL_ENTITY_TYPES.find((t) => n.type.includes(t.label.split(" ")[0]!))?.value ??
      (n.type === "BusinessFunction" ? "BUSINESS_FUNCTION" : "ICT_ASSET");
    setEntityType(enumVal);
    setEntityId(n.id.split(":")[1] ?? n.id);
    setSearch(n.label);
  }, []);

  const detailPath = selected ? detailPathForNode(selected) : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageHeader
        title="Relationship map"
        subtitle="DORA and resilience dependencies from PostgreSQL via GraphQL — not demo data."
      />

      <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border bg-surface p-4 shadow-card">
        <label className="text-sm">
          Search
          <input
            className="ml-2 rounded border px-2 py-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Payment API, provider…"
          />
        </label>
        <Button
          type="button"
          onClick={() => searchMut.mutate()}
          disabled={searchMut.isPending || search.length < 2}
        >
          Find
        </Button>
        {searchMut.data?.length ? (
          <ul className="max-h-24 overflow-auto text-sm">
            {searchMut.data.map((n) => (
              <li key={n.id}>
                <button type="button" className="text-primary hover:underline" onClick={() => onPickSearchResult(n)}>
                  {n.type}: {n.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className="text-sm">
          Entity type
          <select className="ml-2 rounded border px-2 py-1" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            {GQL_ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Entity ID
          <input
            className="ml-2 w-64 rounded border px-2 py-1 font-mono text-xs"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Depth
          <select className="ml-2 rounded border px-2 py-1" value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
            {[1, 2, 3].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          View
          <select className="ml-2 rounded border px-2 py-1" value={view} onChange={(e) => setView(e.target.value as typeof view)}>
            <option value="ALL">All</option>
            <option value="RISK">ICT risk</option>
            <option value="RESILIENCE">Resilience</option>
          </select>
        </label>
        <label className="text-sm">
          Filter type
          <select className="ml-2 rounded border px-2 py-1" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All</option>
            {legend.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Filter relationship
          <input className="ml-2 rounded border px-2 py-1" value={relFilter} onChange={(e) => setRelFilter(e.target.value)} placeholder="SUPPORTS" />
        </label>
        <Button type="button" onClick={() => loadGraph.mutate()} disabled={!entityId || loadGraph.isPending}>
          Load graph
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1 rounded-lg border bg-white">
          {loadGraph.isPending ? (
            <LoadingSkeleton rows={8} />
          ) : loadGraph.error ? (
            <ErrorState message={(loadGraph.error as Error).message} onRetry={() => loadGraph.mutate()} />
          ) : nodes.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Search for an entity or enter an ID, then load the graph.</p>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, n) => setSelected((n.data as { node: GraphNode }).node)}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          )}
        </div>

        <aside className="w-72 shrink-0 space-y-4 overflow-auto rounded-lg border bg-surface p-4 text-sm shadow-card">
          <div>
            <h3 className="font-semibold text-gray-900">Legend</h3>
            <ul className="mt-2 space-y-1">
              {legend.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded border ${TYPE_STYLES[t]?.border ?? "border-gray-400"}`} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {selected ? (
            <div>
              <h3 className="font-semibold text-gray-900">Selection</h3>
              <p className="mt-1 font-medium">{selected.label}</p>
              <p className="text-gray-600">{selected.type}</p>
              {selected.metadata?.inherent_criticality ? (
                <p className="mt-1 text-xs">Inherent criticality: {String(selected.metadata.inherent_criticality)}</p>
              ) : null}
              {selected.metadata?.critical_or_important ? (
                <p className="mt-1 text-xs">Function C/I: {String(selected.metadata.critical_or_important)}</p>
              ) : null}
              {selected.metadata?.supports_critical_function != null ? (
                <p className="mt-1 text-xs text-amber-800">Supports critical function (relationship flag)</p>
              ) : null}
              {detailPath ? (
                <Link to={detailPath} className="mt-3 inline-block text-primary font-medium hover:underline">
                  Open details
                </Link>
              ) : (
                <p className="mt-2 text-xs text-gray-500">No dedicated detail route for this type.</p>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
