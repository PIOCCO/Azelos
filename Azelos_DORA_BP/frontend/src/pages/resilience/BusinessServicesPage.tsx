import { Link } from "react-router-dom";
import type { BusinessService } from "../../api/resilience";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/Badge";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";

export function BusinessServicesPage() {
  const { data, page, setPage, isLoading, error, refetch } = usePaginatedResource<BusinessService>(
    "business-services",
    "/api/v1/business-services",
  );

  return (
    <div>
      <PageHeader
        title="Business services"
        subtitle="Operational services mapped to cloud resources, resilience controls, and DORA requirements."
      />
      <DataTable
        columns={[
          { key: "name", header: "Service", render: (r) => r.name },
          { key: "crit", header: "Criticality", render: (r) => <StatusBadge>{r.criticality}</StatusBadge> },
          {
            key: "rto",
            header: "RTO target / measured",
            render: (r) =>
              `${r.rto_minutes ?? "—"} / ${r.measured_recovery_minutes ?? "—"} min`,
          },
          {
            key: "gap",
            header: "RTO gap",
            render: (r) =>
              r.rto_gap_minutes != null ? (
                <span className={r.rto_gap_minutes > 0 ? "text-red-600" : "text-green-700"}>
                  {r.rto_gap_minutes} min
                </span>
              ) : (
                "—"
              ),
          },
        ]}
        data={data}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
      />
      <p className="mt-4 text-sm text-gray-500">
        Link cloud resources from{" "}
        <Link to="/cloud-environment" className="text-primary font-medium hover:underline">
          Cloud environment
        </Link>
        .
      </p>
    </div>
  );
}
