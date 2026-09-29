import { useQuery } from "@tanstack/react-query";
import { listOrgRequirements, listRegulatoryRequirements } from "../api/dora";
import { useOrg } from "../contexts/OrgContext";
import { LoadingPanel, ErrorPanel } from "../components/ui/StatePanel";

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

  if (baseline.isLoading || orgReq.isLoading) return <LoadingPanel />;
  if (baseline.error) return <ErrorPanel message={(baseline.error as Error).message} />;
  if (orgReq.error) return <ErrorPanel message={(orgReq.error as Error).message} />;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Regulatory requirements</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-medium text-slate-800">DORA regulatory baseline</h2>
          <p className="text-xs text-slate-500">Read-only catalogue from API.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {(baseline.data ?? []).map((r) => (
              <li key={r.id} className="border-b border-slate-100 pb-2">
                <span className="font-mono text-xs text-slate-500">{r.code}</span>
                <p className="font-medium">{r.title}</p>
                {r.description ? <p className="text-slate-600">{r.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-medium text-slate-800">Organization implementation</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-1">Code</th>
                <th>Status</th>
                <th>Applicable</th>
              </tr>
            </thead>
            <tbody>
              {(orgReq.data ?? []).map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">
                    <span className="font-mono text-xs">{r.code}</span>
                    <div>{r.title}</div>
                  </td>
                  <td>{r.implementation_status}</td>
                  <td>{r.applicable ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
