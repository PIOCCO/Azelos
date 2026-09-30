# GraphQL relationship map

## Endpoint

`POST /graphql` (Strawberry + FastAPI). GraphiQL: `/graphql` in browser when UI is served.

Authentication: same JWT as REST (`Authorization: Bearer …` with org in token).

## Example query

```graphql
query {
  organizationGraph(depth: 1, maxNodes: 80, view: ALL) {
    nodes { id type label metadata }
    edges { id source target relationship metadata }
  }
}
```

```graphql
query {
  entityGraph(
    entityType: BUSINESS_FUNCTION
    entityId: "00000000-0000-0000-0000-000000000000"
    depth: 2
    view: ALL
  ) {
    nodes { id type label metadata }
    edges { id source target relationship metadata }
  }
}
```

```graphql
query {
  graphSearch(query: "Payments", limit: 10) {
    id type label
  }
}
```

## Architecture

```
RelationshipMapPage → fetchEntityGraph (GraphQL)
                         ↓
                   EntityGraphService (BFS, depth ≤ 3)
                         ↓
                   EntityGraphRepository (org-scoped SQL)
                         ↓
                   PostgreSQL
```

REST CRUD unchanged at `/api/v1/*`.

## Relationship types (real domain)

`SUPPORTS`, `REALIZED_BY`, `UNDER_CONTRACT`, `PROVIDED_BY`, `ASSESSES`, `DEFINES`, `EVIDENCED_BY`, `SUB_OUTSOURCES`, `USES_RESOURCE`, `DEPENDS_ON`, `FINDING_ON`, `REMEDIATES`.

## Limits

- Max depth: **3**
- Max nodes: **250** per response

## Missing in DB (not shown)

Incidents, BCP/DR plans, standalone critical-function table, resilience test records.

## Frontend

Page: **DORA → Relationship Map**. Library: **React Flow** (`@xyflow/react`) — pan/zoom, minimap, typed node styling, legend.
