import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBia, fetchPaginated, listBia } from "../../api/dora";
import type { BusinessFunction } from "../../api/types";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { useState } from "react";

export function BiaPage() {
  const qc = useQueryClient();
  const [bfId, setBfId] = useState("");
  const [rto, setRto] = useState("");
  const [rpo, setRpo] = useState("");
  const [summary, setSummary] = useState("");
  const bfQ = useQuery({
    queryKey: ["business-functions-bia"],
    queryFn: () => fetchPaginated<BusinessFunction>("/api/v1/business-functions", 1, 100),
  });
  const biaQ = useQuery({ queryKey: ["bia"], queryFn: listBia });
  const createM = useMutation({
    mutationFn: () =>
      createBia({
        business_function_id: bfId,
        rto_hours: rto ? Number(rto) : undefined,
        rpo_hours: rpo ? Number(rpo) : undefined,
        impact_summary: summary || undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bia"] }),
  });

  if (bfQ.isLoading || biaQ.isLoading) return <LoadingSkeleton rows={5} />;
  if (bfQ.error || biaQ.error) {
    return <ErrorState message={((bfQ.error ?? biaQ.error) as Error).message} />;
  }

  const critical = (bfQ.data?.items ?? []).filter(
    (b) => b.critical_or_important === "critical" || b.critical_or_important === "important",
  );

  return (
    <div>
      <PageHeader
        title="Business impact assessment (BIA)"
        subtitle="RTO/RPO per business function — separate from ICT asset inherent criticality."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="New / update BIA record">
          <form
            className="space-y-2 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              createM.mutate();
            }}
          >
            <label className="block">
              Business function
              <select
                required
                className="mt-1 w-full rounded border px-2 py-1"
                value={bfId}
                onChange={(e) => setBfId(e.target.value)}
              >
                <option value="">Select…</option>
                {(bfQ.data?.items ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.critical_or_important})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              RTO (hours)
              <input className="mt-1 w-full rounded border px-2 py-1" value={rto} onChange={(e) => setRto(e.target.value)} />
            </label>
            <label className="block">
              RPO (hours)
              <input className="mt-1 w-full rounded border px-2 py-1" value={rpo} onChange={(e) => setRpo(e.target.value)} />
            </label>
            <label className="block">
              Impact summary
              <textarea className="mt-1 w-full rounded border px-2 py-1" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </label>
            <Button type="submit" disabled={createM.isPending}>
              Save BIA
            </Button>
          </form>
        </Card>
        <Card title="Critical / important functions">
          <ul className="space-y-2 text-sm">
            {critical.map((b) => (
              <li key={b.id} className="border-b border-gray-100 pb-2">
                <span className="font-medium">{b.name}</span> — {b.critical_or_important}
              </li>
            ))}
            {!critical.length ? <li className="text-gray-500">Mark functions as critical or important under Business Functions.</li> : null}
          </ul>
        </Card>
      </div>
      <Card title="BIA records" className="mt-6">
        <ul className="space-y-2 text-sm">
          {(biaQ.data ?? []).map((r) => (
            <li key={r.id}>
              Function {r.business_function_id.slice(0, 8)}… — RTO {r.rto_hours ?? "—"}h / RPO {r.rpo_hours ?? "—"}h
            </li>
          ))}
          {!biaQ.data?.length ? <li className="text-gray-500">No BIA records yet.</li> : null}
        </ul>
      </Card>
    </div>
  );
}
