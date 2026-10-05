import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Node, NodeChange, XYPosition } from "@xyflow/react";
import { Link, useLocation } from "react-router-dom";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./relationshipMapFlow.css";
import { Hand, Maximize2, MousePointer2, ZoomIn, ZoomOut } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRelationshipMapLayout,
  saveRelationshipMapLayout,
  type RelationshipMapLayoutPositions,
} from "../../api/dora";
import {
  detailPathForNode,
  fetchEntityGraph,
  fetchOrganizationGraph,
  graphNodeEntityUuid,
  graphNodeToEntityTypeGql,
  graphSearch,
  type GraphEdge,
  type GraphNode,
  type EntityGraphResult,
} from "../../api/graphql";
import { useAuth } from "../../contexts/AuthContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { useTranslation } from "../../i18n/LocaleContext";
import {
  TYPE_STYLES,
  RELATIONSHIP_COLORS,
  RELATIONSHIP_PRESETS,
  applyGraphFilters,
  edgesForNode,
  layoutNodes,
  mergeFlowNodePositions,
  mergeGraphs,
  neighborSets,
  relationshipTypesInGraph,
  toFlowEdges,
  toFlowNodes,
  areSelectionSetsEqual,
} from "./relationshipMapUtils";

type MapLocationState = {
  gqlType?: string;
  entityId?: string;
  label?: string;
  autoLoad?: boolean;
};

export type GraphInteractionMode = "pan" | "select";

function GraphCanvas(props: {
  rawGraph: EntityGraphResult;
  depth: number;
  hiddenRelationships: Set<string>;
  nodeTypeFilter: Set<string>;
  filterSource: string;
  filterTarget: string;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  canvasSelectedIds: Set<string>;
  interactionMode: GraphInteractionMode;
  layoutResetKey: number;
  layoutEpoch: number;
  persistedPositions: RelationshipMapLayoutPositions;
  onPersistPositions: (positions: RelationshipMapLayoutPositions) => void;
  onSelectNode: (n: GraphNode | null) => void;
  onSelectEdge: (e: GraphEdge | null) => void;
  onCanvasSelectionChange: (ids: Set<string>, primary?: GraphNode | null) => void;
  onToggleCanvasNode: (id: string, graphNode: GraphNode) => void;
  onInteractionModeChange: (mode: GraphInteractionMode) => void;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const manualPositionsRef = useRef<Map<string, XYPosition>>(new Map());
  const didDragRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);
  const suppressSelectionEventsRef = useRef(false);
  const modeChangeGuardRef = useRef(false);
  const {
    rawGraph,
    hiddenRelationships,
    nodeTypeFilter,
    filterSource,
    filterTarget,
    selectedNode,
    selectedEdge,
  } = props;

  const filtered = useMemo(
    () =>
      applyGraphFilters({
        nodes: rawGraph.nodes,
        edges: rawGraph.edges,
        hiddenRelationships,
        nodeTypes: nodeTypeFilter,
        sourceId: filterSource,
        targetId: filterTarget,
      }),
    [rawGraph, hiddenRelationships, nodeTypeFilter, filterSource, filterTarget],
  );

  const canvasSelectedIds = props.canvasSelectedIds;

  const highlight = useMemo(() => {
    if (selectedEdge) {
      return {
        nodes: new Set([selectedEdge.source, selectedEdge.target]),
        edges: new Set([selectedEdge.id]),
        dim: true,
      };
    }
    if (canvasSelectedIds.size > 1) {
      return { nodes: new Set(canvasSelectedIds), edges: new Set<string>(), dim: false };
    }
    if (canvasSelectedIds.size === 1) {
      const only = [...canvasSelectedIds][0]!;
      const n = neighborSets(only, filtered.edges);
      return { nodes: n.nodes, edges: n.edges, dim: true };
    }
    if (selectedNode) {
      const n = neighborSets(selectedNode.id, filtered.edges);
      return { nodes: n.nodes, edges: n.edges, dim: true };
    }
    return { nodes: new Set<string>(), edges: new Set<string>(), dim: false };
  }, [selectedEdge, selectedNode, filtered.edges, canvasSelectedIds]);

  const flowNodes = useMemo(() => {
    const laid = layoutNodes(filtered.nodes, filtered.edges);
    return toFlowNodes(laid, {
      highlightNodeIds: highlight.nodes,
      dimUnrelated: highlight.dim,
      selectedIds: canvasSelectedIds,
      focusedId: selectedNode?.id ?? null,
    });
  }, [filtered, highlight, selectedNode?.id, canvasSelectedIds]);

  const flowNodesWithPersistedLayout = useMemo(() => {
    const saved = new Map<string, XYPosition>();
    for (const [id, pos] of Object.entries(props.persistedPositions)) {
      saved.set(id, { x: pos.x, y: pos.y });
    }
    return mergeFlowNodePositions(flowNodes, saved, new Map());
  }, [flowNodes, props.persistedPositions, props.layoutResetKey]);

  const flowEdges = useMemo(
    () =>
      toFlowEdges(filtered.edges, {
        highlightEdgeId: selectedEdge?.id ?? null,
        highlightEdgeIds: highlight.edges,
        hiddenRelationships,
        dimUnrelated: highlight.dim,
        activeEdgeIds: highlight.edges,
      }),
    [filtered.edges, selectedEdge, highlight, hiddenRelationships],
  );

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(flowNodesWithPersistedLayout);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  const flushPersistedPositions = useCallback(() => {
    const positions = Object.fromEntries(
      [...manualPositionsRef.current.entries()].map(([id, p]) => [id, { x: p.x, y: p.y }]),
    );
    props.onPersistPositions(positions);
  }, [props.onPersistPositions]);

  const schedulePersistedPositions = useCallback(() => {
    if (persistTimerRef.current != null) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null;
      flushPersistedPositions();
    }, 400);
  }, [flushPersistedPositions]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeInternal(changes);
      let dragEnded = false;
      for (const ch of changes) {
        if (ch.type === "position" && ch.position) {
          manualPositionsRef.current.set(ch.id, { x: ch.position.x, y: ch.position.y });
          if (!ch.dragging) dragEnded = true;
        }
      }
      if (dragEnded) schedulePersistedPositions();
    },
    [onNodesChangeInternal, schedulePersistedPositions],
  );

  // Seed manual positions only when persisted layout changes — never on highlight/filter recalc.
  useEffect(() => {
    manualPositionsRef.current.clear();
    for (const [id, pos] of Object.entries(props.persistedPositions)) {
      manualPositionsRef.current.set(id, { x: pos.x, y: pos.y });
    }
  }, [props.layoutEpoch, props.layoutResetKey, props.persistedPositions]);

  useEffect(() => {
    suppressSelectionEventsRef.current = true;
    setNodes(flowNodesWithPersistedLayout);
    setEdges(flowEdges);
    requestAnimationFrame(() => {
      suppressSelectionEventsRef.current = false;
    });
  }, [flowNodesWithPersistedLayout, flowEdges, setNodes, setEdges]);

  useEffect(() => {
    modeChangeGuardRef.current = true;
    suppressSelectionEventsRef.current = true;
    const timeoutId = window.setTimeout(() => {
      modeChangeGuardRef.current = false;
      suppressSelectionEventsRef.current = false;
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [props.interactionMode]);

  const onNodeDragStart = useCallback(() => {
    didDragRef.current = true;
  }, []);

  const onNodeDragStop = useCallback(
    (_evt: MouseEvent | TouchEvent, node: Node) => {
      manualPositionsRef.current.set(node.id, { x: node.position.x, y: node.position.y });
      schedulePersistedPositions();
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    },
    [schedulePersistedPositions],
  );

  useEffect(() => {
    if (rawGraph.nodes.length) {
      requestAnimationFrame(() => fitView({ padding: 0.15, duration: 200 }));
    }
  }, [rawGraph.nodes.length, fitView]);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current != null) window.clearTimeout(persistTimerRef.current);
    };
  }, []);

  const { onCanvasSelectionChange, onSelectEdge } = props;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") {
        onCanvasSelectionChange(new Set(), null);
        onSelectEdge(null);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const ids = new Set(filtered.nodes.map((n) => n.id));
        onCanvasSelectionChange(ids);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtered.nodes, onCanvasSelectionChange, onSelectEdge]);

  const isSelectMode = props.interactionMode === "select";

  return (
    <ReactFlow
      className={`relationship-map-flow h-full w-full select-none ${
        isSelectMode ? "relationship-map-flow--select" : "relationship-map-flow--pan"
      }`}
      nodes={nodes}
      edges={edges}
      nodesDraggable
      nodeDragThreshold={6}
      elementsSelectable={isSelectMode}
      selectionOnDrag={isSelectMode}
      selectionMode={SelectionMode.Partial}
      panOnDrag={isSelectMode ? [1, 2] : true}
      panOnScroll
      zoomOnScroll
      multiSelectionKeyCode="Shift"
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      onSelectionChange={({ nodes: selectedNodes }) => {
        if (!isSelectMode || suppressSelectionEventsRef.current) return;
        const ids = new Set(selectedNodes.map((n) => n.id));
        if (modeChangeGuardRef.current && ids.size === 0 && canvasSelectedIds.size > 0) return;
        if (areSelectionSetsEqual(ids, canvasSelectedIds)) return;
        props.onCanvasSelectionChange(ids);
      }}
      onNodeClick={(evt, n) => {
        if (didDragRef.current) return;
        props.onSelectEdge(null);
        const graphNode = (n.data as { node: GraphNode }).node;
        if (isSelectMode) {
          props.onSelectNode(graphNode);
          return;
        }
        if (evt.shiftKey) {
          props.onToggleCanvasNode(n.id, graphNode);
          return;
        }
        props.onCanvasSelectionChange(new Set([n.id]), graphNode);
      }}
      onEdgeClick={(_, e) => {
        const raw = rawGraph.edges.find((x) => x.id === e.id);
        props.onCanvasSelectionChange(new Set(), null);
        props.onSelectNode(null);
        props.onSelectEdge(raw ?? null);
      }}
      onPaneClick={(evt) => {
        if (evt.shiftKey) return;
        props.onCanvasSelectionChange(new Set(), null);
        props.onSelectEdge(null);
      }}
      fitView
    >
      <Panel
        position="top-left"
        className="!m-2 flex items-center gap-1 rounded-lg border border-gray-200 bg-white/95 px-2 py-1.5 text-xs shadow-card backdrop-blur-sm"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          title="Pan"
          aria-pressed={!isSelectMode}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
            !isSelectMode ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            props.onInteractionModeChange("pan");
          }}
        >
          <Hand className="h-3.5 w-3.5" aria-hidden />
          Pan
        </button>
        <button
          type="button"
          title="Select"
          aria-pressed={isSelectMode}
          className={`inline-flex items-center gap-1 rounded px-2 py-1 ${
            isSelectMode ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            props.onInteractionModeChange("select");
          }}
        >
          <MousePointer2 className="h-3.5 w-3.5" aria-hidden />
          Select
        </button>
        <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
        <button
          type="button"
          title="Zoom out"
          className="rounded p-1 text-gray-700 hover:bg-gray-100"
          onClick={() => zoomOut({ duration: 150 })}
        >
          <ZoomOut className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          title="Zoom in"
          className="rounded p-1 text-gray-700 hover:bg-gray-100"
          onClick={() => zoomIn({ duration: 150 })}
        >
          <ZoomIn className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          title="Fit view"
          className="rounded p-1 text-gray-700 hover:bg-gray-100"
          onClick={() => fitView({ padding: 0.15, duration: 200 })}
        >
          <Maximize2 className="h-4 w-4" aria-hidden />
        </button>
      </Panel>
      <MiniMap />
      <Controls showInteractive={false} />
      <Background />
    </ReactFlow>
  );
}

export function RelationshipMapPage() {
  return (
    <ReactFlowProvider>
      <RelationshipMapInner />
    </ReactFlowProvider>
  );
}

function RelationshipMapInner() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { fitView } = useReactFlow();
  const [rawGraph, setRawGraph] = useState<EntityGraphResult | null>(null);
  const [search, setSearch] = useState("");
  const [depth, setDepth] = useState(1);
  const [view, setView] = useState<"ALL" | "RISK" | "RESILIENCE">("ALL");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [interactionMode, setInteractionMode] = useState<GraphInteractionMode>("pan");
  const [canvasSelectedIds, setCanvasSelectedIds] = useState<Set<string>>(() => new Set());
  const [hiddenRelationships, setHiddenRelationships] = useState<Set<string>>(new Set());
  const [nodeTypeFilter, setNodeTypeFilter] = useState<Set<string>>(new Set());
  const [filterSource, setFilterSource] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [activePreset, setActivePreset] = useState<string>("all");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const initialLoaded = useRef(false);
  const [layoutResetKey, setLayoutResetKey] = useState(0);
  const [layoutEpoch, setLayoutEpoch] = useState(0);
  const layoutSeeded = useRef(false);

  const layoutQ = useQuery({
    queryKey: ["relationship-map-layout", session?.organizationId],
    queryFn: getRelationshipMapLayout,
    enabled: !!session?.token,
  });

  const saveLayoutM = useMutation({
    mutationFn: saveRelationshipMapLayout,
    onSuccess: (data) => {
      queryClient.setQueryData(["relationship-map-layout", session?.organizationId], data);
    },
    onError: (err: Error) => {
      console.error("Failed to persist relationship map layout:", err.message);
    },
  });

  useEffect(() => {
    layoutSeeded.current = false;
    setLayoutEpoch(0);
  }, [session?.organizationId]);

  useEffect(() => {
    if (layoutQ.isSuccess && !layoutSeeded.current) {
      layoutSeeded.current = true;
      setLayoutEpoch(1);
    }
  }, [layoutQ.isSuccess, session?.organizationId]);

  const persistedPositions = layoutQ.data?.positions ?? {};

  const persistPositions = useCallback(
    (positions: RelationshipMapLayoutPositions) => {
      saveLayoutM.mutate(positions);
    },
    [saveLayoutM],
  );

  const onCanvasSelectionChange = useCallback(
    (ids: Set<string>, primary?: GraphNode | null) => {
      setCanvasSelectedIds((prev) => {
        if (areSelectionSetsEqual(prev, ids)) return prev;
        return new Set(ids);
      });
      if (primary !== undefined) {
        setSelectedNode(primary);
        return;
      }
      if (ids.size === 1) {
        const id = [...ids][0]!;
        setSelectedNode(rawGraph?.nodes.find((n) => n.id === id) ?? null);
      } else if (ids.size === 0) {
        setSelectedNode(null);
      }
    },
    [rawGraph],
  );

  const onToggleCanvasNode = useCallback(
    (id: string, graphNode: GraphNode) => {
      setCanvasSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        if (next.size === 1) {
          const only = [...next][0]!;
          setSelectedNode(rawGraph?.nodes.find((n) => n.id === only) ?? graphNode);
        } else if (next.size === 0) {
          setSelectedNode(null);
        } else {
          setSelectedNode(graphNode);
        }
        return next;
      });
    },
    [rawGraph],
  );

  const overviewQ = useQuery({
    queryKey: ["org-graph", depth, view],
    queryFn: () => fetchOrganizationGraph({ depth, maxNodes: 80, view }),
    enabled: !!session?.token,
  });

  useEffect(() => {
    if (overviewQ.data && !initialLoaded.current) {
      setRawGraph(overviewQ.data);
      const first = overviewQ.data.nodes[0] ?? null;
      setSelectedNode(first);
      setCanvasSelectedIds(first ? new Set([first.id]) : new Set());
      initialLoaded.current = true;
    }
  }, [overviewQ.data]);

  useEffect(() => {
    if (initialLoaded.current && overviewQ.data) {
      setRawGraph(overviewQ.data);
    }
  }, [overviewQ.data, depth, view]);

  const expandNode = useMutation({
    mutationFn: async (node: GraphNode) => {
      const gqlType = graphNodeToEntityTypeGql(node.type);
      const entityId = graphNodeEntityUuid(node);
      const sub = await fetchEntityGraph({
        entityType: gqlType,
        entityId,
        depth: 1,
        view,
      });
      return sub;
    },
    onSuccess: (sub) => {
      setRawGraph((prev) => (prev ? mergeGraphs(prev, sub) : sub));
    },
  });

  const focusNode = useMutation({
    mutationFn: async (node: GraphNode) => {
      const gqlType = graphNodeToEntityTypeGql(node.type);
      const entityId = graphNodeEntityUuid(node);
      return fetchEntityGraph({ entityType: gqlType, entityId, depth, view });
    },
    onSuccess: (data) => {
      setRawGraph(data);
      const first = data.nodes[0] ?? null;
      setSelectedNode(first);
      setCanvasSelectedIds(first ? new Set([first.id]) : new Set());
    },
  });

  const searchMut = useMutation({
    mutationFn: () => graphSearch(search, 15),
  });

  const presentRelTypes = useMemo(
    () => (rawGraph ? relationshipTypesInGraph(rawGraph.edges) : []),
    [rawGraph],
  );

  const availablePresets = useMemo(() => {
    return Object.entries(RELATIONSHIP_PRESETS).filter(([key, preset]) => {
      if (key === "all") return true;
      return preset.relationships.some((r) => presentRelTypes.includes(r));
    });
  }, [presentRelTypes]);

  const toggleRelationship = (rel: string) => {
    setHiddenRelationships((prev) => {
      const next = new Set(prev);
      if (next.has(rel)) next.delete(rel);
      else next.add(rel);
      return next;
    });
  };

  const showAllRelationships = () => setHiddenRelationships(new Set());
  const hideAllRelationships = () => setHiddenRelationships(new Set(presentRelTypes));

  const applyPreset = (key: string) => {
    setActivePreset(key);
    const preset = RELATIONSHIP_PRESETS[key];
    if (!preset || key === "all") {
      showAllRelationships();
      return;
    }
    const hide = presentRelTypes.filter((r) => !preset.relationships.includes(r));
    setHiddenRelationships(new Set(hide));
  };

  const toggleNodeType = (t: string) => {
    setNodeTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  useEffect(() => {
    const st = location.state as MapLocationState | null;
    if (!st?.entityId || !st.gqlType) return;
    initialLoaded.current = true;
    const gqlToType: Record<string, string> = {
      BUSINESS_FUNCTION: "BusinessFunction",
      ICT_ASSET: "ICTAsset",
      ICT_SERVICE: "ICTService",
      ICT_PROVIDER: "ICTProvider",
      CONTRACT: "Contract",
      RISK_ASSESSMENT: "RiskAssessment",
      BUSINESS_SERVICE: "BusinessService",
    };
    const nodeType = gqlToType[st.gqlType!] ?? "ICTAsset";
    focusNode.mutate({
      id: `${nodeType}:${st.entityId}`,
      type: nodeType,
      label: st.label ?? st.entityId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const nodeOptions = rawGraph?.nodes ?? [];
  const detailPath = selectedNode ? detailPathForNode(selectedNode) : null;
  const nodeEdges = selectedNode && rawGraph ? edgesForNode(selectedNode.id, rawGraph.edges) : null;

  const loading = overviewQ.isLoading && !rawGraph;
  const error = overviewQ.error as Error | null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-2">
      <PageHeader
        title={t("pages.relationshipMap.title")}
        subtitle={t("pages.relationshipMap.subtitle")}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm shadow-card">
        <span className="text-gray-500">Depth</span>
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            type="button"
            className={`rounded px-2 py-1 ${depth === d ? "bg-primary text-white" : "bg-gray-100"}`}
            onClick={() => setDepth(d)}
          >
            {d} hop{d > 1 ? "s" : ""}
          </button>
        ))}
        <span className="mx-1 text-gray-300">|</span>
        {availablePresets.map(([key, preset]) => (
          <button
            key={key}
            type="button"
            className={`rounded px-2 py-1 ${activePreset === key ? "bg-primary text-white" : "bg-gray-100"}`}
            onClick={() => applyPreset(key)}
          >
            {preset.label}
          </button>
        ))}
        <span className="mx-1 text-gray-300">|</span>
        <select
          className="rounded border px-2 py-1"
          value={view}
          onChange={(e) => setView(e.target.value as typeof view)}
        >
          <option value="ALL">All</option>
          <option value="RISK">Risk view</option>
          <option value="RESILIENCE">Resilience view</option>
        </select>
        <Button type="button" variant="secondary" onClick={() => fitView({ padding: 0.15 })}>
          Fit view
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!rawGraph?.nodes.length || saveLayoutM.isPending}
          onClick={() => {
            if (!rawGraph) return;
            const laid = layoutNodes(rawGraph.nodes, rawGraph.edges);
            const positions = Object.fromEntries(
              laid.map((n) => [n.id, { x: n.position.x, y: n.position.y }]),
            );
            saveLayoutM.mutate(positions, {
              onSuccess: (data) => {
                queryClient.setQueryData(
                  ["relationship-map-layout", session?.organizationId],
                  data,
                );
                setLayoutEpoch((e) => e + 1);
                setLayoutResetKey((k) => k + 1);
                overviewQ.refetch();
              },
            });
          }}
        >
          {t("pages.relationshipMap.resetGraph")}
        </Button>
        <button
          type="button"
          className="text-primary underline"
          onClick={() => setShowAdvancedSearch((v) => !v)}
        >
          {showAdvancedSearch ? t("pages.relationshipMap.toggleSearchHide") : t("pages.relationshipMap.toggleSearchShow")}
        </button>
      </div>

      {showAdvancedSearch ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
          <input
            className="min-w-[200px] rounded border px-2 py-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search.length >= 2 && searchMut.mutate()}
            placeholder={t("pages.relationshipMap.searchPlaceholder")}
          />
          <Button type="button" onClick={() => searchMut.mutate()} disabled={search.length < 2}>
            {t("pages.relationshipMap.find")}
          </Button>
          {searchMut.data?.map((n) => (
            <button
              key={n.id}
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                setSelectedNode(n);
                focusNode.mutate(n);
              }}
            >
              {n.type}: {n.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="min-h-[420px] min-h-0 min-w-0 flex-[3] rounded-lg border bg-white [&>div]:h-full">
          {loading ? (
            <LoadingSkeleton rows={8} />
          ) : error ? (
            <ErrorState message={error.message} onRetry={() => overviewQ.refetch()} />
          ) : layoutQ.isError ? (
            <ErrorState
              message={`Could not load saved layout: ${(layoutQ.error as Error).message}`}
              onRetry={() => layoutQ.refetch()}
            />
          ) : !layoutQ.isFetched ? (
            <LoadingSkeleton rows={8} />
          ) : !rawGraph?.nodes.length ? (
            <p className="p-6 text-sm text-gray-500">
              No relationship data yet. Add business functions, ICT assets, or providers in DORA modules, then
              refresh.
            </p>
          ) : (
            <GraphCanvas
              rawGraph={rawGraph}
              depth={depth}
              hiddenRelationships={hiddenRelationships}
              nodeTypeFilter={nodeTypeFilter}
              filterSource={filterSource}
              filterTarget={filterTarget}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              canvasSelectedIds={canvasSelectedIds}
              interactionMode={interactionMode}
              layoutResetKey={layoutResetKey}
              layoutEpoch={layoutEpoch}
              persistedPositions={persistedPositions}
              onPersistPositions={persistPositions}
              onSelectNode={setSelectedNode}
              onSelectEdge={setSelectedEdge}
              onCanvasSelectionChange={onCanvasSelectionChange}
              onToggleCanvasNode={onToggleCanvasNode}
              onInteractionModeChange={setInteractionMode}
            />
          )}
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-auto text-sm">
          <section className="rounded-lg border bg-surface p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Relationship legend</h3>
              <div className="flex gap-1 text-xs">
                <button type="button" className="text-primary" onClick={showAllRelationships}>
                  Show all
                </button>
                <span className="text-gray-300">·</span>
                <button type="button" className="text-primary" onClick={hideAllRelationships}>
                  Hide all
                </button>
              </div>
            </div>
            <ul className="max-h-40 space-y-1 overflow-auto">
              {presentRelTypes.map((rel) => {
                const on = !hiddenRelationships.has(rel);
                const color = RELATIONSHIP_COLORS[rel] ?? "#64748b";
                return (
                  <li key={rel}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left ${on ? "" : "opacity-40 line-through"}`}
                      onClick={() => toggleRelationship(rel)}
                    >
                      <span className="h-0.5 w-6 shrink-0" style={{ backgroundColor: color }} />
                      {rel}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-lg border bg-surface p-3 shadow-card">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <label className="mt-2 block text-xs text-gray-600">
              Source node
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
              >
                <option value="">Any</option>
                {nodeOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-xs text-gray-600">
              Target node
              <select
                className="mt-1 w-full rounded border px-2 py-1"
                value={filterTarget}
                onChange={(e) => setFilterTarget(e.target.value)}
              >
                <option value="">Any</option>
                {nodeOptions.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs font-medium text-gray-700">Entity types</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {[...new Set(rawGraph?.nodes.map((n) => n.type) ?? [])].sort().map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`rounded border px-1.5 py-0.5 text-xs ${
                    nodeTypeFilter.size === 0 || nodeTypeFilter.has(t)
                      ? TYPE_STYLES[t]?.bg ?? "bg-gray-50"
                      : "opacity-40"
                  }`}
                  onClick={() => toggleNodeType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border bg-surface p-3 shadow-card">
            <h3 className="font-semibold text-gray-900">Node types</h3>
            <ul className="mt-2 space-y-1">
              {Object.keys(TYPE_STYLES).map((t) => (
                <li key={t} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={`h-3 w-3 rounded border ${TYPE_STYLES[t]?.border ?? "border-gray-400"}`} />
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {selectedEdge ? (
            <section className="rounded-lg border bg-surface p-3 shadow-card">
              <h3 className="font-semibold text-gray-900">Relationship</h3>
              <p className="mt-1 font-medium">{selectedEdge.relationship}</p>
              <p className="text-xs text-gray-600">From: {selectedEdge.source}</p>
              <p className="text-xs text-gray-600">To: {selectedEdge.target}</p>
              {selectedEdge.metadata && Object.keys(selectedEdge.metadata).length > 0 ? (
                <pre className="mt-2 max-h-24 overflow-auto rounded bg-gray-50 p-2 text-[10px]">
                  {JSON.stringify(selectedEdge.metadata, null, 2)}
                </pre>
              ) : null}
            </section>
          ) : null}

          {selectedNode ? (
            <section className="rounded-lg border bg-surface p-3 shadow-card">
              <h3 className="font-semibold text-gray-900">{selectedNode.label}</h3>
              <p className="text-gray-600">{selectedNode.type}</p>
              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 ? (
                <ul className="mt-2 space-y-0.5 text-xs text-gray-600">
                  {Object.entries(selectedNode.metadata).map(([k, v]) => (
                    <li key={k}>
                      {k}: {String(v)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {nodeEdges ? (
                <>
                  <p className="mt-2 font-medium text-gray-800">Outgoing ({nodeEdges.outgoing.length})</p>
                  <ul className="max-h-20 overflow-auto text-xs">
                    {nodeEdges.outgoing.map((e) => (
                      <li key={e.id}>
                        {e.relationship} → {e.target.split(":")[1]?.slice(0, 8)}…
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-medium text-gray-800">Incoming ({nodeEdges.incoming.length})</p>
                  <ul className="max-h-20 overflow-auto text-xs">
                    {nodeEdges.incoming.map((e) => (
                      <li key={e.id}>
                        {e.relationship} ← {e.source.split(":")[1]?.slice(0, 8)}…
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" className="px-2 py-1 text-xs" onClick={() => expandNode.mutate(selectedNode)}>
                  Expand +1 hop
                </Button>
                <Button
                  type="button"
                  className="px-2 py-1 text-xs"
                  variant="secondary"
                  onClick={() => focusNode.mutate(selectedNode)}
                >
                  Center graph here
                </Button>
                {detailPath ? (
                  <Link to={detailPath} className="text-sm text-primary font-medium hover:underline">
                    Open details
                  </Link>
                ) : null}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
