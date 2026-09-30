from enum import Enum
from typing import Any, Optional
from uuid import UUID

import strawberry
from strawberry.types import Info

from app.domain.graph.types import EntityType as DomainEntityType
from app.domain.graph.types import GraphView as DomainGraphView
from app.domain.graph.types import MAX_GRAPH_DEPTH
from app.graphql.context import GraphQLContext
from app.core.exceptions import AppError
from app.services.entity_graph import EntityGraphService


@strawberry.enum
class EntityTypeGQL(Enum):
    BUSINESS_FUNCTION = "BusinessFunction"
    INFORMATION_ASSET = "InformationAsset"
    ICT_ASSET = "ICTAsset"
    ICT_SERVICE = "ICTService"
    ICT_PROVIDER = "ICTProvider"
    CONTRACT = "Contract"
    RISK_ASSESSMENT = "RiskAssessment"
    BUSINESS_SERVICE = "BusinessService"
    RESILIENCE_FINDING = "ResilienceFinding"


@strawberry.enum
class GraphViewGQL(Enum):
    ALL = "ALL"
    RISK = "RISK"
    RESILIENCE = "RESILIENCE"


@strawberry.type
class GraphNode:
    id: str
    type: str
    label: str
    metadata: Optional[strawberry.scalars.JSON] = None


@strawberry.type
class GraphEdge:
    id: str
    source: str
    target: str
    relationship: str
    metadata: Optional[strawberry.scalars.JSON] = None


@strawberry.type
class EntityGraph:
    nodes: list[GraphNode]
    edges: list[GraphEdge]


def _require_auth(info: Info[GraphQLContext, None]) -> GraphQLContext:
    ctx = info.context
    if ctx.auth is None:
        raise Exception("Authentication required")
    return ctx


def _to_gql_graph(dto) -> EntityGraph:
    return EntityGraph(
        nodes=[
            GraphNode(id=n.id, type=n.type, label=n.label, metadata=n.metadata or {})
            for n in dto.nodes
        ],
        edges=[
            GraphEdge(
                id=e.id,
                source=e.source,
                target=e.target,
                relationship=e.relationship,
                metadata=e.metadata or {},
            )
            for e in dto.edges
        ],
    )


@strawberry.type
class Query:
    @strawberry.field(description=f"Neighborhood graph (max depth {MAX_GRAPH_DEPTH}).")
    def entity_graph(
        self,
        info: Info[GraphQLContext, None],
        entity_type: EntityTypeGQL,
        entity_id: strawberry.ID,
        depth: int = 2,
        view: GraphViewGQL = GraphViewGQL.ALL,
    ) -> EntityGraph:
        gctx = _require_auth(info)
        service = EntityGraphService(gctx.db, gctx.auth.organization_id)
        domain_type = DomainEntityType(entity_type.value)
        try:
            dto = service.entity_graph(
                domain_type,
                UUID(str(entity_id)),
                depth=depth,
                view=DomainGraphView(view.value),
            )
        except AppError as exc:
            raise Exception(exc.message) from exc
        return _to_gql_graph(dto)

    @strawberry.field
    def graph_search(
        self,
        info: Info[GraphQLContext, None],
        query: str,
        limit: int = 20,
    ) -> list[GraphNode]:
        gctx = _require_auth(info)
        service = EntityGraphService(gctx.db, gctx.auth.organization_id)
        return [
            GraphNode(id=n.id, type=n.type, label=n.label, metadata=n.metadata or {})
            for n in service.search(query, limit=limit)
        ]


def build_schema(*, introspection_enabled: bool = True):
    return strawberry.Schema(
        query=Query,
        extensions=[],
        config=strawberry.schema.config.StrawberryConfig(
            disable_field_suggestions=not introspection_enabled,
        ),
    )
