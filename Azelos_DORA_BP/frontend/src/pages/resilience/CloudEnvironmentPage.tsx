import type { CloudAccount, CloudResource } from "../../api/resilience";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";

export function CloudEnvironmentPage({ embedded = false }: { embedded?: boolean }) {
  const accounts = usePaginatedResource<CloudAccount>("cloud-accounts", "/api/v1/cloud-accounts");
  const resources = usePaginatedResource<CloudResource>("cloud-resources", "/api/v1/cloud-resources");

  return (
    <div>
      {!embedded ? (
        <PageHeader
          title="Cloud environment"
          subtitle="Discovered Azure inventory (server-side credentials). Resources are not auto-assigned to business services."
        />
      ) : (
        <p className="mb-4 text-sm text-gray-600">
          Azure subscriptions and discovered resources for resilience and ICT inventory. Register accounts via the cloud
          accounts API or your deployment runbook; discovery runs server-side.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Connected accounts">
          <DataTable
            emptyTitle="No cloud accounts"
            emptyDescription="Cloud environment not configured. Register an Azure subscription account, then run discovery."
            columns={[
              { key: "name", header: "Name", render: (r) => r.display_name },
              { key: "sub", header: "Subscription", render: (r) => r.subscription_id },
              {
                key: "disc",
                header: "Last discovery",
                render: (r) => r.last_discovery_status ?? "Not run",
              },
            ]}
            data={accounts.data}
            page={accounts.page}
            onPageChange={accounts.setPage}
            isLoading={accounts.isLoading}
            error={accounts.error}
            onRetry={accounts.refetch}
          />
        </Card>
        <Card title="Resource inventory">
          <DataTable
            emptyTitle="No cloud resources"
            emptyDescription="Resources appear after connecting a cloud account and running discovery."
            columns={[
              { key: "name", header: "Resource", render: (r) => r.name },
              { key: "type", header: "Type", render: (r) => r.resource_type },
              { key: "region", header: "Region", render: (r) => r.region ?? "—" },
              { key: "prov", header: "Provenance", render: (r) => r.provenance },
              {
                key: "svc",
                header: "Business service",
                render: (r) => r.business_service_id ?? "Unassigned",
              },
            ]}
            data={resources.data}
            page={resources.page}
            onPageChange={resources.setPage}
            isLoading={resources.isLoading}
            error={resources.error}
            onRetry={resources.refetch}
          />
        </Card>
      </div>
    </div>
  );
}
