import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPaginated, linkFunctionService } from "../../api/dora";
import type { BusinessFunction, ICTService } from "../../api/types";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";

export function DependenciesPage() {
  const qc = useQueryClient();
  const [bfId, setBfId] = useState("");
  const [svcId, setSvcId] = useState("");
  const bfQ = useQuery({
    queryKey: ["bf-deps"],
    queryFn: () => fetchPaginated<BusinessFunction>("/api/v1/business-functions", 1, 100),
  });
  const svcQ = useQuery({
    queryKey: ["svc-deps"],
    queryFn: () => fetchPaginated<ICTService>("/api/v1/ict-services", 1, 100),
  });
  const linkM = useMutation({
    mutationFn: () => linkFunctionService(bfId, svcId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bf-deps"] });
      setSvcId("");
    },
  });

  if (bfQ.isLoading || svcQ.isLoading) return <LoadingSkeleton rows={5} />;
  if (bfQ.error || svcQ.error) {
    return <ErrorState message={((bfQ.error ?? svcQ.error) as Error).message} />;
  }

  return (
    <div>
      <PageHeader
        title="Dependencies"
        subtitle="Link business functions to ICT services (feeds the relationship map)."
      />
      <Card title="Function → service mapping">
        <form
          className="flex flex-wrap gap-2 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            linkM.mutate();
          }}
        >
          <select
            required
            className="rounded border px-2 py-1"
            value={bfId}
            onChange={(e) => setBfId(e.target.value)}
          >
            <option value="">Business function…</option>
            {(bfQ.data?.items ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            required
            className="rounded border px-2 py-1"
            value={svcId}
            onChange={(e) => setSvcId(e.target.value)}
          >
            <option value="">ICT service…</option>
            {(svcQ.data?.items ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={linkM.isPending}>
            Link
          </Button>
        </form>
        {linkM.error ? <p className="mt-2 text-sm text-red-600">{(linkM.error as Error).message}</p> : null}
        {linkM.isSuccess ? <p className="mt-2 text-sm text-green-700">Mapping saved.</p> : null}
      </Card>
    </div>
  );
}
