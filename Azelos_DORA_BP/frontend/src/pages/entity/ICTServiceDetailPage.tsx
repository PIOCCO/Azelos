import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import type { ICTService } from "../../api/types";
import { patchIctService } from "../../api/dora";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { EntityDetailPage } from "./EntityDetailPage";
import { EntityRelationshipsPanel } from "../../components/dora/EntityRelationshipsPanel";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function ICTServiceDetailPage() {
  const { serviceId } = useParams();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [serviceStatus, setServiceStatus] = useState("");
  const q = useQuery({
    queryKey: ["ict-service", serviceId],
    queryFn: () => apiRequest<ICTService>(`/api/v1/ict-services/${serviceId}`),
    enabled: !!serviceId,
  });
  const patchM = useMutation({
    mutationFn: () =>
      patchIctService(serviceId!, {
        name: name || undefined,
        status: serviceStatus || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ict-service", serviceId] });
      qc.invalidateQueries({ queryKey: ["ict-services"] });
    },
  });

  const s = q.data;
  useEffect(() => {
    if (s) {
      setName(s.name);
      setServiceStatus(s.status);
    }
  }, [s]);

  return (
    <ModuleGate item={{ label: "ICT services", moduleKey: "THIRD_PARTY_RISK" }}>
      <EntityDetailPage
        backTo="/ict-services"
        backLabel="ICT services"
        title={s?.name ?? "ICT service"}
        isLoading={q.isLoading}
        error={q.error as Error | null}
        onRetry={() => q.refetch()}
        fields={
          s
            ? [
                { label: "Contract ID", value: s.contract_id },
                { label: "Status", value: s.status },
                { label: "Supports C/I", value: s.supports_critical_or_important },
              ]
            : []
        }
      />
      {s ? (
        <Card title="Edit service" className="mt-4">
          <form
            className="flex flex-wrap gap-2 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              patchM.mutate();
            }}
          >
            <input
              className="rounded border px-2 py-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="rounded border px-2 py-1"
              value={serviceStatus}
              onChange={(e) => setServiceStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="decommissioned">Decommissioned</option>
            </select>
            <Button type="submit" disabled={patchM.isPending}>
              Save
            </Button>
          </form>
          {patchM.error ? (
            <p className="mt-2 text-sm text-red-600">{(patchM.error as Error).message}</p>
          ) : null}
        </Card>
      ) : null}
      {serviceId ? (
        <div className="mt-6">
          <EntityRelationshipsPanel
            entityTypeGql="ICT_SERVICE"
            entityId={serviceId}
            entityNodeId={`ICTService:${serviceId}`}
          />
          <p className="mt-2 text-sm text-gray-600">
            Link this service to business functions on the{" "}
            <Link to="/dependencies" className="text-primary underline">
              Dependencies
            </Link>{" "}
            page.
          </p>
        </div>
      ) : null}
    </ModuleGate>
  );
}
