import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  detailPathForNode,
  fetchEntityGraph,
  graphNodeEntityUuid,
  graphNodeToEntityTypeGql,
  type GraphNode,
} from "../../api/graphql";
import { Card } from "../ui/Card";
import { LoadingSkeleton, ErrorState } from "../ui/States";

function groupByType(nodes: GraphNode[], excludeId: string) {
  const map = new Map<string, GraphNode[]>();
  for (const n of nodes) {
    if (n.id === excludeId) continue;
    const list = map.get(n.type) ?? [];
    list.push(n);
    map.set(n.type, list);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function EntityRelationshipsPanel({
  entityTypeGql,
  entityId,
  entityNodeId,
  title = "Relationships",
}: {
  entityTypeGql: string;
  entityId: string;
  /** Full graph node id (e.g. RiskAssessment:uuid) when known */
  entityNodeId?: string;
  title?: string;
}) {
  const q = useQuery({
    queryKey: ["entity-graph-trace", entityTypeGql, entityId],
    queryFn: () => fetchEntityGraph({ entityType: entityTypeGql, entityId, depth: 1 }),
  });

  if (q.isLoading) return <LoadingSkeleton rows={4} />;
  if (q.error) {
    return (
      <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
    );
  }

  const centerId =
    entityNodeId ??
    q.data!.nodes.find((n) => graphNodeEntityUuid(n) === entityId)?.id ??
    `${entityTypeGql}:${entityId}`;

  const groups = groupByType(q.data!.nodes, centerId);

  return (
    <Card
      title={title}
      action={
        <Link
          to="/dora/relationship-map"
          state={{
            gqlType: entityTypeGql,
            entityId,
            autoLoad: true,
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          Open in Relationship Map
        </Link>
      }
    >
      {groups.length === 0 ? (
        <p className="text-sm text-gray-500">No related entities in the graph at depth 1.</p>
      ) : (
        <ul className="space-y-4 text-sm">
          {groups.map(([type, nodes]) => (
            <li key={type}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{type}</p>
              <ul className="mt-1 space-y-1">
                {nodes.slice(0, 8).map((n) => {
                  const path = detailPathForNode(n);
                  const uuid = graphNodeEntityUuid(n);
                  const mapState = {
                    gqlType: graphNodeToEntityTypeGql(n.type),
                    entityId: uuid,
                    label: n.label,
                    autoLoad: true,
                  };
                  return (
                    <li key={n.id} className="flex flex-wrap items-center gap-2">
                      {path ? (
                        <Link to={path} className="font-medium text-primary hover:underline">
                          {n.label}
                        </Link>
                      ) : (
                        <span className="text-gray-800">{n.label}</span>
                      )}
                      <Link
                        to="/dora/relationship-map"
                        state={mapState}
                        className="text-xs text-gray-500 hover:text-primary"
                      >
                        Graph
                      </Link>
                    </li>
                  );
                })}
                {nodes.length > 8 ? (
                  <li className="text-xs text-gray-500">+{nodes.length - 8} more</li>
                ) : null}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
