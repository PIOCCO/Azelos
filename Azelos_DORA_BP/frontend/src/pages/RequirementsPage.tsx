import { useQuery } from "@tanstack/react-query";
import { listOrgRequirements, listRegulatoryRequirements } from "../api/dora";
import { useOrg } from "../contexts/OrgContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { LoadingSkeleton, ErrorState } from "../components/ui/States";
import { StatusBadge } from "../components/ui/Badge";

export function RequirementsPage() {
  const { organizationId } = useOrg();
  const baseline = useQuery({
    queryKey: ["regulatory-baseline"],
    queryFn: listRegulatoryRequirements,
  });
  const orgReq = useQuery({
    queryKey: ["org-requirements", organizationId],
    queryFn: () => listOrgRequirements(organizationId!),
    enabled: !!organizationId,
  });

  if (baseline.isLoading || orgReq.isLoading) {
    return (
      <>
        <PageHeader title="Regulatory Requirements" />
        <LoadingSkeleton rows={6} />
      </>
    );
  }
  if (baseline.error) return <ErrorState message={(baseline.error as Error).message} />;
  if (orgReq.error) return <ErrorState message={(orgReq.error as Error).message} />;

  return (
    <div>
      <PageHeader title="Regulatory Requirements" subtitle="Baseline is read-only; implementation is organization-specific." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="DORA regulatory baseline">
          <ul className="space-y-3 text-sm">
            {(baseline.data ?? []).map((r) => (
              <li key={r.id} className="border-b border-gray-100 pb-3">
                <span className="font-mono text-xs text-gray-500">{r.code}</span>
                <p className="font-medium text-gray-900">{r.title}</p>
                {r.description ? <p className="text-gray-600">{r.description}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Organization implementation">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="pb-2">Requirement</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Applicable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(orgReq.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="py-3">
                      <span className="font-mono text-xs text-gray-500">{r.code}</span>
                      <div className="font-medium">{r.title}</div>
                    </td>
                    <td className="py-3">{r.implementation_status}</td>
                    <td className="py-3">
                      <StatusBadge tone={r.applicable ? "success" : "neutral"}>
                        {r.applicable ? "Yes" : "No"}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
