import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/client";
import type { ICTIncident } from "../../api/types";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { EntityDetailPage } from "./EntityDetailPage";
import { toneFromLevel } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EntityRelationshipsPanel } from "../../components/dora/EntityRelationshipsPanel";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { can, isReadOnlyAuditor } from "../../lib/permissions";

const STATUSES = [
  "detected",
  "classified",
  "investigating",
  "contained",
  "resolved",
  "closed",
  "post_incident_review",
] as const;

export function IncidentDetailPage() {
  const { incidentId } = useParams();
  const { session } = useAuth();
  const canWrite = can(session?.role, "security.write") && !isReadOnlyAuditor(session?.role);

  const q = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => apiRequest<ICTIncident>(`/api/v1/incidents/${incidentId}`),
    enabled: !!incidentId,
  });

  const advance = useMutation({
    mutationFn: (status: string) =>
      apiRequest<ICTIncident>(`/api/v1/incidents/${incidentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => q.refetch(),
  });

  const data = q.data;

  return (
    <ModuleGate item={{ label: "Incidents", moduleKey: "INCIDENT_MANAGEMENT" }}>
      <EntityDetailPage
        backTo="/incidents"
        backLabel="Incidents"
        title={data?.title ?? "Incident"}
        badges={
          data
            ? [
                { label: data.severity, tone: toneFromLevel(data.severity) },
                { label: data.status, tone: "medium" },
                ...(data.is_major ? [{ label: "Major ICT incident", tone: "critical" as const }] : []),
              ]
            : undefined
        }
        isLoading={q.isLoading}
        error={q.error as Error | null}
        onRetry={() => q.refetch()}
        fields={
          data
            ? [
                { label: "Owner", value: data.owner ?? "—" },
                { label: "Description", value: data.description ?? "—" },
                { label: "Root cause", value: data.root_cause ?? "—" },
                { label: "Lessons learned", value: data.lessons_learned ?? "—" },
                {
                  label: "Detected",
                  value: data.detected_at ? new Date(data.detected_at).toLocaleString() : "—",
                },
              ]
            : []
        }
      />
      {canWrite && data ? (
        <Card title="Lifecycle" className="mt-6">
          <p className="mb-3 text-sm text-gray-600">Advance incident status (persisted with audit trail).</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                variant={data.status === s ? "primary" : "secondary"}
                disabled={advance.isPending}
                onClick={() => advance.mutate(s)}
              >
                {s.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </Card>
      ) : null}
      {data?.timeline?.length ? (
        <Card title="Timeline" className="mt-6">
          <ul className="space-y-3 text-sm">
            {data.timeline.map((ev) => (
              <li key={ev.id} className="border-l-2 border-primary/30 pl-3">
                <p className="font-medium text-gray-900">{ev.event_type}</p>
                <p className="text-gray-700">{ev.description}</p>
                <p className="text-xs text-gray-500">
                  {ev.actor} · {new Date(ev.recorded_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      {incidentId ? (
        <div className="mt-6">
          <EntityRelationshipsPanel
            entityTypeGql="ICT_INCIDENT"
            entityId={incidentId}
            entityNodeId={`ICTIncident:${incidentId}`}
          />
        </div>
      ) : null}
    </ModuleGate>
  );
}
