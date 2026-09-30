import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/client";
import type { Risk } from "../../api/types";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { EntityDetailPage } from "./EntityDetailPage";
import { toneFromLevel } from "../../components/ui/Badge";
import { EntityRelationshipsPanel } from "../../components/dora/EntityRelationshipsPanel";

export function RiskDetailPage() {
  const { riskId } = useParams();
  const q = useQuery({
    queryKey: ["risk", riskId],
    queryFn: () => apiRequest<Risk>(`/api/v1/risks/${riskId}`),
    enabled: !!riskId,
  });

  return (
    <ModuleGate item={{ label: "ICT Risk Management", moduleKey: "ICT_RISK" }}>
      <EntityDetailPage
        backTo="/risks"
        backLabel="ICT Risk Register"
        title={`Risk ${riskId?.slice(0, 8).toUpperCase() ?? ""}`}
        badges={
          q.data
            ? [{ label: q.data.resulting_risk_level, tone: toneFromLevel(q.data.resulting_risk_level) }]
            : undefined
        }
        isLoading={q.isLoading}
        error={q.error as Error | null}
        onRetry={() => q.refetch()}
        fields={
          q.data
            ? [
                { label: "Assessor", value: q.data.assessor },
                { label: "Resulting risk level", value: q.data.resulting_risk_level },
                { label: "Calculated at", value: new Date(q.data.calculated_at).toLocaleString() },
                { label: "Provider ID", value: q.data.provider_id ?? "—" },
                { label: "Contract ID", value: q.data.contract_id ?? "—" },
                { label: "Service ID", value: q.data.service_id ?? "—" },
              ]
            : []
        }
      />
      {riskId ? (
        <div className="mt-6">
          <EntityRelationshipsPanel
            entityTypeGql="RISK_ASSESSMENT"
            entityId={riskId}
            entityNodeId={`RiskAssessment:${riskId}`}
          />
        </div>
      ) : null}
    </ModuleGate>
  );
}
