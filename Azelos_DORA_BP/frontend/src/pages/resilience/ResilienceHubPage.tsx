import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getResilienceDashboard } from "../../api/resilience";
import type { ResilienceFinding } from "../../api/resilience";
import { PageHeader } from "../../components/ui/PageHeader";
import { KpiCard } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { LoadingSkeleton, ErrorState } from "../../components/ui/States";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";

export function ResilienceHubPage() {
  const dashQ = useQuery({ queryKey: ["resilience-dash"], queryFn: getResilienceDashboard });
  const findings = usePaginatedResource<ResilienceFinding>(
    "findings-hub",
    "/api/v1/resilience/findings",
  );

  if (dashQ.isLoading) return <LoadingSkeleton rows={6} />;
  if (dashQ.error) {
    return <ErrorState message={(dashQ.error as Error).message} onRetry={() => dashQ.refetch()} />;
  }

  const d = dashQ.data!;

  return (
    <div>
      <PageHeader title="Resilience" subtitle="Assessments, gaps, and recovery posture (no compliance score)." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Services with gaps" value={d.services_with_gaps} tone="warning" />
        <KpiCard label="High findings" value={d.high_findings} tone="danger" />
        <KpiCard label="Open remediations" value={d.open_remediations} />
        <KpiCard label="Cloud resources" value={d.cloud_resources} />
      </div>
      <p className="mt-6 text-sm text-gray-600">
        Workflow:{" "}
        <Link to="/cloud-environment" className="text-primary hover:underline">
          Cloud
        </Link>{" "}
        →{" "}
        <Link to="/business-services" className="text-primary hover:underline">
          Business services
        </Link>{" "}
        → assessments →{" "}
        <Link to="/findings" className="text-primary hover:underline">
          Findings
        </Link>
      </p>
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Findings</h2>
        <DataTable
          columns={[
            { key: "t", header: "Title", render: (r) => r.title },
            { key: "s", header: "Severity", render: (r) => r.severity },
            { key: "st", header: "Status", render: (r) => r.status },
          ]}
          data={findings.data}
          page={findings.page}
          onPageChange={findings.setPage}
          isLoading={findings.isLoading}
          error={findings.error}
          onRetry={findings.refetch}
        />
      </div>
    </div>
  );
}
