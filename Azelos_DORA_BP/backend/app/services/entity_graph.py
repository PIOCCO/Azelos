from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.domain.graph.types import (
    DEFAULT_OVERVIEW_ANCHORS,
    DEFAULT_OVERVIEW_MAX_NODES,
    MAX_GRAPH_DEPTH,
    MAX_GRAPH_NODES,
    EntityGraphDTO,
    EntityType,
    GraphEdgeDTO,
    GraphNodeDTO,
    GraphView,
)
from app.repositories.entity_graph import EntityGraphRepository


class EntityGraphService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = EntityGraphRepository(db, organization_id)

    def _accumulate_bfs(
        self,
        nodes: dict[str, GraphNodeDTO],
        edges: dict[str, GraphEdgeDTO],
        entity_type: EntityType,
        entity_id: UUID,
        depth: int,
        view: GraphView,
        max_nodes: int,
    ) -> None:
        root = self.repo.get_node(entity_type, entity_id)
        if root is None:
            return
        nodes[root.id] = root
        frontier: list[tuple[EntityType, UUID]] = [(entity_type, entity_id)]
        for _level in range(depth):
            if len(nodes) >= max_nodes:
                break
            next_frontier: list[tuple[EntityType, UUID]] = []
            for etype, eid in frontier:
                if len(nodes) >= max_nodes:
                    break
                if etype.value == "ServiceDependency":
                    continue
                if str(eid).startswith("dep-"):
                    continue
                n_nodes, n_edges = self.repo.expand(etype, eid, view=view.value)
                for n in n_nodes:
                    nodes[n.id] = n
                    if len(nodes) >= max_nodes:
                        break
                for e in n_edges:
                    edges[e.id] = e
                for e in n_edges:
                    for nid in (e.source, e.target):
                        parts = nid.split(":", 1)
                        if len(parts) != 2:
                            continue
                        try:
                            net = EntityType(parts[0])
                            raw = parts[1]
                        except ValueError:
                            continue
                        try:
                            uid = UUID(raw)
                        except ValueError:
                            continue
                        next_frontier.append((net, uid))
            frontier = next_frontier

    def entity_graph(
        self,
        entity_type: EntityType,
        entity_id: UUID,
        depth: int,
        view: GraphView = GraphView.ALL,
    ) -> EntityGraphDTO:
        if depth < 1 or depth > MAX_GRAPH_DEPTH:
            raise AppError(
                "INVALID_DEPTH",
                f"depth must be between 1 and {MAX_GRAPH_DEPTH}",
                400,
            )

        if self.repo.get_node(entity_type, entity_id) is None:
            raise AppError("NOT_FOUND", "Entity not found", 404)
        nodes: dict[str, GraphNodeDTO] = {}
        edges: dict[str, GraphEdgeDTO] = {}
        self._accumulate_bfs(
            nodes, edges, entity_type, entity_id, depth, view, MAX_GRAPH_NODES
        )

        return EntityGraphDTO(
            nodes=list(nodes.values())[:MAX_GRAPH_NODES],
            edges=list(edges.values()),
        )

    def organization_overview_graph(
        self,
        depth: int = 1,
        max_nodes: int = DEFAULT_OVERVIEW_MAX_NODES,
        view: GraphView = GraphView.ALL,
        relationship_types: list[str] | None = None,
        node_types: list[str] | None = None,
        anchor_limit: int = DEFAULT_OVERVIEW_ANCHORS,
    ) -> EntityGraphDTO:
        if depth < 1 or depth > MAX_GRAPH_DEPTH:
            raise AppError(
                "INVALID_DEPTH",
                f"depth must be between 1 and {MAX_GRAPH_DEPTH}",
                400,
            )
        cap = max(10, min(max_nodes, MAX_GRAPH_NODES))
        anchors = self.repo.list_graph_anchors(limit=min(anchor_limit, 12))
        nodes: dict[str, GraphNodeDTO] = {}
        edges: dict[str, GraphEdgeDTO] = {}
        for etype, eid in anchors:
            self._accumulate_bfs(nodes, edges, etype, eid, depth, view, cap)
            if len(nodes) >= cap:
                break

        out_nodes = list(nodes.values())[:cap]
        out_edges = list(edges.values())
        if relationship_types:
            allowed = set(relationship_types)
            out_edges = [e for e in out_edges if e.relationship in allowed]
        if node_types:
            allowed_nt = set(node_types)
            out_nodes = [n for n in out_nodes if n.type in allowed_nt]
            node_ids = {n.id for n in out_nodes}
            out_edges = [
                e
                for e in out_edges
                if e.source in node_ids and e.target in node_ids
            ]
        else:
            node_ids = {n.id for n in out_nodes}
            out_edges = [
                e
                for e in out_edges
                if e.source in node_ids and e.target in node_ids
            ]

        return EntityGraphDTO(nodes=out_nodes, edges=out_edges)

    def search(self, query: str, limit: int = 20) -> list[GraphNodeDTO]:
        q = (query or "").strip()
        if len(q) < 2:
            raise AppError("INVALID_QUERY", "Search query must be at least 2 characters", 400)
        if len(q) > 128:
            raise AppError("INVALID_QUERY", "Search query too long", 400)
        safe_limit = max(1, min(limit, 50))
        return self.repo.search_entities(q, limit=safe_limit)
