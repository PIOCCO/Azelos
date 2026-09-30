import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getResilienceDashboard } from "../../api/resilience";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, KpiCard } from "../../components/ui/Card";
import { LoadingSkeleton, ErrorState } from "../../components/ui/States";

export function DoraHubPage() {
  const q = useQuery({ queryKey: ["resilience-dash"], queryFn: getResilienceDashboard });
  if (q.isLoading) return <LoadingSkeleton rows={5} />;
  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;
  const d = q.data!;

  return (
    <div>
      <PageHeader
        title="DORA"
        subtitle="Factual control states per service — not an automatic compliance determination."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Implemented" value={d.dora_implemented} tone="primary" />
        <KpiCard label="Partial" value={d.dora_partial} tone="warning" />
        <KpiCard label="Not implemented" value={d.dora_not_implemented} tone="danger" />
        <KpiCard label="Insufficient evidence" value={d.dora_insufficient_evidence} />
        <KpiCard label="Not assessed" value={d.dora_not_assessed} />
      </div>
      <Card title="Sections" className="mt-6">
        <ul className="text-sm space-y-2 text-gray-700">
          <li>
            <Link to="/requirements" className="text-primary hover:underline">
              Requirements
            </Link>{" "}
            — organization baseline from regulatory catalogue
          </li>
          <li>
            <Link to="/controls" className="text-primary hover:underline">
              Controls
            </Link>{" "}
            — contractual control definitions
          </li>
          <li>
            <Link to="/evidence" className="text-primary hover:underline">
              Evidence
            </Link>{" "}
            — uploads and{" "}
            <Link to="/resilience-evidence" className="text-primary hover:underline">
              resilience evidence
            </Link>
          </li>
          <li>
            <Link to="/findings" className="text-primary hover:underline">
              Findings & remediation
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
