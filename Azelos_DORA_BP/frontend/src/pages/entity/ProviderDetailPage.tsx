import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../api/client";
import type { Supplier } from "../../api/types";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { EntityDetailPage } from "./EntityDetailPage";
import { EntityRelationshipsPanel } from "../../components/dora/EntityRelationshipsPanel";

export function ProviderDetailPage() {
  const { providerId } = useParams();
  const q = useQuery({
    queryKey: ["provider", providerId],
    queryFn: () => apiRequest<Supplier>(`/api/v1/ict-providers/${providerId}`),
    enabled: !!providerId,
  });

  const p = q.data;

  return (
    <ModuleGate item={{ label: "ICT Third-Party Providers", moduleKey: "THIRD_PARTY_RISK" }}>
      <EntityDetailPage
        backTo="/ict-providers"
        backLabel="ICT providers"
        title={p?.legal_name ?? "Provider"}
        isLoading={q.isLoading}
        error={q.error as Error | null}
        onRetry={() => q.refetch()}
        fields={
          p
            ? [
                { label: "Legal name", value: p.legal_name },
                { label: "Trading name", value: p.trading_name ?? "—" },
                { label: "LEI", value: p.lei ?? "—" },
                { label: "Country", value: p.country_code },
              ]
            : []
        }
      />
      {providerId ? (
        <div className="mt-6">
          <EntityRelationshipsPanel
            entityTypeGql="ICT_PROVIDER"
            entityId={providerId}
            entityNodeId={`ICTProvider:${providerId}`}
          />
        </div>
      ) : null}
    </ModuleGate>
  );
}
