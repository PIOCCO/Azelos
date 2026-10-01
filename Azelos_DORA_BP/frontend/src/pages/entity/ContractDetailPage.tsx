import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import type { Contract } from "../../api/types";
import { patchContract } from "../../api/dora";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { EntityDetailPage } from "./EntityDetailPage";
import { EntityRelationshipsPanel } from "../../components/dora/EntityRelationshipsPanel";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function ContractDetailPage() {
  const { contractId } = useParams();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const q = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => apiRequest<Contract>(`/api/v1/contracts/${contractId}`),
    enabled: !!contractId,
  });
  const patchM = useMutation({
    mutationFn: () => patchContract(contractId!, { status: status || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contract", contractId] });
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  const c = q.data;
  useEffect(() => {
    if (c?.status) setStatus(c.status);
  }, [c?.status]);

  return (
    <ModuleGate item={{ label: "Contracts", moduleKey: "THIRD_PARTY_RISK" }}>
      <EntityDetailPage
        backTo="/contracts"
        backLabel="Contracts"
        title={c?.reference_number ?? "Contract"}
        isLoading={q.isLoading}
        error={q.error as Error | null}
        onRetry={() => q.refetch()}
        fields={
          c
            ? [
                { label: "Reference", value: c.reference_number },
                { label: "Type", value: c.contract_type },
                { label: "Status", value: c.status },
                { label: "Start date", value: c.start_date },
                { label: "End date", value: c.end_date ?? "—" },
                { label: "Provider ID", value: c.provider_id },
              ]
            : []
        }
      />
      {c ? (
        <Card title="Update status" className="mt-4">
          <form
            className="flex flex-wrap gap-2 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              patchM.mutate();
            }}
          >
            <select
              className="rounded border px-2 py-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
              <option value="pending_renewal">Pending renewal</option>
            </select>
            <Button type="submit" disabled={patchM.isPending}>
              Save
            </Button>
          </form>
          {patchM.error ? (
            <p className="mt-2 text-sm text-red-600">{(patchM.error as Error).message}</p>
          ) : null}
          {patchM.isSuccess ? <p className="mt-2 text-sm text-green-700">Updated.</p> : null}
        </Card>
      ) : null}
      {contractId ? (
        <div className="mt-6">
          <EntityRelationshipsPanel
            entityTypeGql="CONTRACT"
            entityId={contractId}
            entityNodeId={`Contract:${contractId}`}
          />
        </div>
      ) : null}
    </ModuleGate>
  );
}
