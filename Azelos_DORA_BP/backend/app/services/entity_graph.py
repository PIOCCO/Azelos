from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.domain.graph.types import (
    MAX_GRAPH_DEPTH,
    MAX_GRAPH_NODES,
    EntityGraphDTO,
    EntityType,
    GraphEdgeDTO,
    GraphNodeDTO,
    GraphView,
    node_key,
)
from app.repositories.entity_graph import EntityGraphRepository


class EntityGraphService:
    def __init__(self, db: Session, organization_id: UUID) -> None:
        self.repo = EntityGraphRepository(db, organization_id)

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

        root = self.repo.get_node(entity_type, entity_id)
        if root is None:
            raise AppError("NOT_FOUND", "Entity not found", 404)

        nodes: dict[str, GraphNodeDTO] = {root.id: root}
        edges: dict[str, GraphEdgeDTO] = {}

        frontier: list[tuple[EntityType, UUID]] = [(entity_type, entity_id)]
        for _level in range(depth):
            next_frontier: list[tuple[EntityType, UUID]] = []
            for etype, eid in frontier:
                if etype.value == "ServiceDependency":
                    continue
                if str(eid).startswith("dep-"):
                    continue
                n_nodes, n_edges = self.repo.expand(etype, eid, view=view.value)
                for n in n_nodes:
                    nodes[n.id] = n
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
            if len(nodes) >= MAX_GRAPH_NODES:
                break

        return EntityGraphDTO(
            nodes=list(nodes.values())[:MAX_GRAPH_NODES],
            edges=list(edges.values()),
        )

    def search(self, query: str, limit: int = 20) -> list[GraphNodeDTO]:
        q = (query or "").strip()
        if len(q) < 2:
            raise AppError("INVALID_QUERY", "Search query must be at least 2 characters", 400)
        if len(q) > 128:
            raise AppError("INVALID_QUERY", "Search query too long", 400)
        safe_limit = max(1, min(limit, 50))
        return self.repo.search_entities(q, limit=safe_limit)
