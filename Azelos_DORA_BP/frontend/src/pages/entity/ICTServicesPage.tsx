import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Contract, ICTService } from "../../api/types";
import { createIctService, fetchPaginated } from "../../api/dora";
import {
  EvidenceAttachmentsPanel,
  EvidencePdfColumnSubHeader,
} from "../../components/dora/EvidenceAttachmentsPanel";
import { EntityListPage } from "./EntityListPage";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";

export function ICTServicesPage() {
  const qc = useQueryClient();
  const [contractId, setContractId] = useState("");
  const [name, setName] = useState("");
  const [crit, setCrit] = useState("important");
  const contractsListQ = useQuery({
    queryKey: ["contracts", "service-form-list"],
    queryFn: () => fetchPaginated<Contract>("/api/v1/contracts", 1, 200),
  });
  const createM = useMutation({
    mutationFn: () =>
      createIctService({
        contract_id: contractId,
        name,
        supports_critical_or_important: crit,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ict-services"] });
      setName("");
    },
  });

  const contracts = contractsListQ.data?.items ?? [];

  return (
    <>
      <Card title="New ICT service" className="mb-4">
        <form
          className="flex flex-wrap gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate();
          }}
        >
          <select
            required
            className="min-w-[180px] rounded border px-2 py-1"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
          >
            <option value="">Select contract…</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.reference_number}
              </option>
            ))}
          </select>
          <input
            required
            className="rounded border px-2 py-1"
            placeholder="Service name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="rounded border px-2 py-1"
            value={crit}
            onChange={(e) => setCrit(e.target.value)}
          >
            <option value="critical">Critical</option>
            <option value="important">Important</option>
            <option value="neither">Neither</option>
          </select>
          <Button type="submit" disabled={createM.isPending || !contractId}>
            Create service
          </Button>
        </form>
        {!contracts.length && !contractsListQ.isLoading ? (
          <p className="mt-2 text-sm text-amber-800">
            Create a{" "}
            <Link to="/contracts" className="underline">
              contract
            </Link>{" "}
            first.
          </p>
        ) : null}
        {createM.error ? (
          <p className="mt-2 text-sm text-red-600">{(createM.error as Error).message}</p>
        ) : null}
        {createM.isSuccess ? <p className="mt-2 text-sm text-green-700">Service created.</p> : null}
      </Card>
      <EntityListPage<ICTService>
        pageTitle="ICT services"
        tableTitle="Services under contract"
        path="/api/v1/ict-services"
        queryKey="ict-services"
        moduleItem={{ label: "ICT services", moduleKey: "THIRD_PARTY_RISK" }}
        emptyTitle="No ICT services yet"
        emptyDescription="Link a service to a contract using the form above."
        columns={[
          {
            key: "name",
            header: "Name",
            render: (r) => (
              <Link to={`/ict-services/${r.id}`} className="font-medium text-primary hover:underline">
                {r.name}
              </Link>
            ),
          },
          {
            key: "crit",
            header: "C/I",
            render: (r) => (
              <StatusBadge tone={toneFromLevel(r.supports_critical_or_important)}>
                {r.supports_critical_or_important}
              </StatusBadge>
            ),
          },
          { key: "status", header: "Status", render: (r) => r.status },
          {
            key: "evidence",
            header: "Evidence (PDF)",
            subHeader: (
              <div>
                <EvidencePdfColumnSubHeader />
                <p className="mt-0.5 text-[10px] font-normal normal-case tracking-normal text-gray-400">
                  Contract-level evidence for this service
                </p>
              </div>
            ),
            className: "min-w-[300px] align-top",
            render: (r) => (
              <EvidenceAttachmentsPanel
                entityType="contract"
                entityId={r.contract_id}
                initialFiles={r.evidence_files}
                invalidateQueryKeys={[["ict-services"], ["contracts"]]}
              />
            ),
          },
        ]}
      />
    </>
  );
}
