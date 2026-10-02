import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ContractWithEvidence, Supplier } from "../../api/types";
import {
  EvidenceAttachmentsPanel,
  EvidencePdfColumnSubHeader,
} from "../../components/dora/EvidenceAttachmentsPanel";
import { createContract, fetchPaginated } from "../../api/dora";
import { EntityListPage } from "./EntityListPage";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";

export function ContractsPage() {
  const qc = useQueryClient();
  const [providerId, setProviderId] = useState("");
  const [reference, setReference] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const providersQ = useQuery({
    queryKey: ["ict-providers", "contract-form"],
    queryFn: () => fetchPaginated<Supplier>("/api/v1/ict-providers", 1, 200),
  });
  const createM = useMutation({
    mutationFn: () =>
      createContract({
        provider_id: providerId,
        reference_number: reference,
        start_date: startDate,
        contract_type: "outsourcing",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      setReference("");
    },
  });

  return (
    <>
      <Card title="New contractual arrangement" className="mb-4">
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
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          >
            <option value="">Select ICT provider…</option>
            {(providersQ.data?.items ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.legal_name}
              </option>
            ))}
          </select>
          <input
            required
            className="rounded border px-2 py-1"
            placeholder="Reference number"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <input
            required
            type="date"
            className="rounded border px-2 py-1"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Button type="submit" disabled={createM.isPending || !providerId}>
            Create contract
          </Button>
        </form>
        {!providersQ.data?.items.length && !providersQ.isLoading ? (
          <p className="mt-2 text-sm text-amber-800">
            Register an{" "}
            <Link to="/ict-providers" className="underline">
              ICT provider
            </Link>{" "}
            first.
          </p>
        ) : null}
        {createM.error ? (
          <p className="mt-2 text-sm text-red-600">{(createM.error as Error).message}</p>
        ) : null}
        {createM.isSuccess ? <p className="mt-2 text-sm text-green-700">Contract created.</p> : null}
      </Card>
      <EntityListPage<ContractWithEvidence>
        pageTitle="Contractual arrangements"
        tableTitle="Contracts"
        path="/api/v1/contracts"
        queryKey="contracts"
        searchable
        moduleItem={{ label: "Contracts", moduleKey: "THIRD_PARTY_RISK" }}
        emptyTitle="No contracts yet"
        emptyDescription="Create a contract linked to an ICT provider using the form above."
        columns={[
          {
            key: "ref",
            header: "Reference",
            render: (r) => (
              <Link to={`/contracts/${r.id}`} className="font-medium text-primary hover:underline">
                {r.reference_number}
              </Link>
            ),
          },
          { key: "type", header: "Type", render: (r) => r.contract_type },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <StatusBadge tone={toneFromLevel(r.status)}>{r.status}</StatusBadge>
            ),
          },
          { key: "start", header: "Start", render: (r) => r.start_date },
          {
            key: "evidence",
            header: "Evidence (PDF)",
            subHeader: <EvidencePdfColumnSubHeader />,
            className: "min-w-[300px] align-top",
            render: (r) => (
              <EvidenceAttachmentsPanel
                entityType="contract"
                entityId={r.id}
                initialFiles={r.evidence_files}
                invalidateQueryKeys={[["contracts"]]}
              />
            ),
          },
        ]}
      />
    </>
  );
}
