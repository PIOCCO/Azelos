import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { SubOutsourcing, Supplier } from "../../api/types";
import { createSubOutsourcing, fetchPaginated, patchSubOutsourcing } from "../../api/dora";
import { EntityListPage } from "./EntityListPage";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function SubOutsourcingPage() {
  const qc = useQueryClient();
  const [providerId, setProviderId] = useState("");
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("DE");
  const [parentId, setParentId] = useState("");
  const providersQ = useQuery({
    queryKey: ["ict-providers", "sub-form"],
    queryFn: () => fetchPaginated<Supplier>("/api/v1/ict-providers", 1, 200),
  });
  const subsQ = useQuery({
    queryKey: ["sub-outsourcing", "parent-options"],
    queryFn: () => fetchPaginated<SubOutsourcing>("/api/v1/sub-outsourcing", 1, 200),
  });
  const createM = useMutation({
    mutationFn: () =>
      createSubOutsourcing({
        provider_id: providerId,
        legal_name: legalName,
        country_code: country,
        parent_subcontractor_id: parentId || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub-outsourcing"] });
      setLegalName("");
    },
  });

  const archiveM = useMutation({
    mutationFn: (id: string) => patchSubOutsourcing(id, { status: "inactive" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sub-outsourcing"] }),
  });

  const parentOptions = (subsQ.data?.items ?? []).filter((s) => s.provider_id === providerId);

  return (
    <>
      <Card title="Register sub-outsourcing party" className="mb-4">
        <form
          className="flex flex-wrap gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate();
          }}
        >
          <select
            required
            className="min-w-[160px] rounded border px-2 py-1"
            value={providerId}
            onChange={(e) => {
              setProviderId(e.target.value);
              setParentId("");
            }}
          >
            <option value="">Primary provider…</option>
            {(providersQ.data?.items ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.legal_name}
              </option>
            ))}
          </select>
          <input
            required
            className="rounded border px-2 py-1"
            placeholder="Sub-contractor legal name"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
          <input
            required
            maxLength={2}
            className="w-14 rounded border px-2 py-1"
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
          />
          <select
            className="min-w-[140px] rounded border px-2 py-1"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">No parent (tier 1)</option>
            {parentOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.legal_name} (depth {s.depth_rank})
              </option>
            ))}
          </select>
          <Button type="submit" disabled={createM.isPending || !providerId}>
            Add
          </Button>
        </form>
        {createM.error ? (
          <p className="mt-2 text-sm text-red-600">{(createM.error as Error).message}</p>
        ) : null}
      </Card>
      <EntityListPage<SubOutsourcing>
        pageTitle="Sub-outsourcing chain"
        tableTitle="Sub-contractors"
        path="/api/v1/sub-outsourcing"
        queryKey="sub-outsourcing"
        moduleItem={{ label: "Sub-outsourcing", moduleKey: "THIRD_PARTY_RISK" }}
        emptyTitle="No sub-outsourcing records"
        emptyDescription="Document nth-party providers under your primary ICT suppliers."
        columns={[
          { key: "name", header: "Legal name", render: (r) => r.legal_name },
          { key: "depth", header: "Depth", render: (r) => r.depth_rank },
          { key: "status", header: "Status", render: (r) => r.status },
          {
            key: "actions",
            header: "",
            render: (r) =>
              r.status === "active" ? (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => archiveM.mutate(r.id)}
                >
                  Mark inactive
                </button>
              ) : (
                "—"
              ),
          },
        ]}
      />
    </>
  );
}
