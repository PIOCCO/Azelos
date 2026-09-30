import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchPaginated, listOrgRequirements, probeStubEndpoint } from "../api/dora";
import { getResilienceDashboard } from "../api/resilience";
import type { BusinessFunction, ICTAsset, Risk, Supplier } from "../api/types";
import { useOrg } from "../contexts/OrgContext";
import { Card, KpiCard } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, LoadingSkeleton } from "../components/ui/States";

export function DashboardPage() {
  const { organizationId, organizationName, applicability, isLoading: orgLoading } = useOrg();
  const firstName = organizationName?.split(" ")[0] ?? "there";

  const counts = useQueries({
    queries: [
      { queryKey: ["dash", "providers"], queryFn: () => fetchPaginated<Supplier>("/api/v1/ict-providers", 1, 1) },
      { queryKey: ["dash", "risks"], queryFn: () => fetchPaginated<Risk>("/api/v1/risks", 1, 1) },
      { queryKey: ["dash", "ict"], queryFn: () => fetchPaginated<ICTAsset>("/api/v1/ict-assets", 1, 1) },
      { queryKey: ["dash", "functions"], queryFn: () => fetchPaginated<BusinessFunction>("/api/v1/business-functions", 1, 1) },
    ],
  });

  const requirementsQ = useQuery({
    queryKey: ["dash-reqs"],
    queryFn: () => listOrgRequirements(organizationId!),
    enabled: !!organizationId,
  });

  const incidentsQ = useQuery({
    queryKey: ["dash-incidents-probe"],
    queryFn: () => probeStubEndpoint("/api/v1/incidents?page=1&page_size=1"),
  });

  const resilienceQ = useQuery({
    queryKey: ["dash-resilience"],
    queryFn: getResilienceDashboard,
    enabled: !!organizationId,
  });

  if (orgLoading || counts.some((q) => q.isLoading)) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  const err = counts.find((q) => q.error)?.error as Error | undefined;
  if (err) return <ErrorState message={err.message} onRetry={() => counts.forEach((q) => q.refetch())} />;

  const [providers, risks, ictAssets, functions] = counts.map((q) => q.data?.total ?? 0);
  const reqs = requirementsQ.data ?? [];
  const implemented = reqs.filter((r) => r.implementation_status?.toLowerCase().includes("implement")).length;
  const partial = reqs.filter((r) => r.implementation_status?.toLowerCase().includes("partial")).length;
  const notStarted = Math.max(0, reqs.length - implemented - partial);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}. Organization: ${organizationName ?? "—"}.`}
      />

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900">Cloud business resilience</h2>
        <p className="text-sm text-gray-500">Live API metrics — no compliance score or fabricated cloud data.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Critical services"
          value={resilienceQ.data?.critical_business_services ?? "—"}
          tone="primary"
        />
        <KpiCard
          label="Services with gaps"
          value={resilienceQ.data?.services_with_gaps ?? "—"}
          tone="warning"
        />
        <KpiCard label="High findings" value={resilienceQ.data?.high_findings ?? "—"} tone="danger" />
        <KpiCard label="Cloud resources" value={resilienceQ.data?.cloud_resources ?? "—"} />
        <KpiCard label="Open remediations" value={resilienceQ.data?.open_remediations ?? "—"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="ICT providers" value={providers} />
        <KpiCard label="ICT assets" value={ictAssets} />
        <KpiCard label="Open risks" value={risks} tone="warning" />
        <KpiCard label="Business functions (DORA)" value={functions} />
        <KpiCard
          label="Active incidents"
          value={incidentsQ.data?.ok ? "—" : "N/A"}
          tone="danger"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Action center" className="lg:col-span-1">
          <ul className="space-y-4 text-sm">
            {risks > 0 ? (
              <li>
                <span className="font-semibold text-red-600">High</span>
                <p className="text-gray-700">{risks} risk assessment(s) on record.</p>
                <Link to="/risks" className="text-primary text-sm font-medium hover:underline">
                  Review risks
                </Link>
              </li>
            ) : (
              <li className="text-gray-500">No risks recorded yet.</li>
            )}
            {applicability?.requirements_hint?.slice(0, 2).map((code) => (
              <li key={code}>
                <span className="font-semibold text-amber-600">Hint</span>
                <p className="text-gray-700">Requirement {code} influenced by applicability rules.</p>
                <Link to="/requirements" className="text-primary text-sm font-medium hover:underline">
                  View requirements
                </Link>
              </li>
            )) ?? null}
          </ul>
        </Card>

        <Card title="Requirement implementation" className="lg:col-span-1">
          {requirementsQ.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : reqs.length === 0 ? (
            <p className="text-sm text-gray-500">No organization requirements returned by API.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div
                className="relative h-28 w-28 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(#2563eb 0 ${(implemented / reqs.length) * 100}%, #93c5fd ${(implemented / reqs.length) * 100}% ${((implemented + partial) / reqs.length) * 100}%, #e5e7eb ${((implemented + partial) / reqs.length) * 100}% 100%)`,
                }}
                role="img"
                aria-label={`Implemented ${implemented}, partial ${partial}, not started ${notStarted}`}
              />
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-primary mr-2" />
                  Implemented: {implemented}
                </li>
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-300 mr-2" />
                  Partial: {partial}
                </li>
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-gray-300 mr-2" />
                  Other / not started: {notStarted}
                </li>
              </ul>
            </div>
          )}
        </Card>

        <Card title="Enabled modules" className="lg:col-span-1">
          <ul className="space-y-2 text-sm text-gray-700">
            {(applicability?.modules ?? [])
              .filter((m) => m.enabled && m.applicable)
              .slice(0, 8)
              .map((m) => (
                <li key={m.key} className="flex justify-between gap-2">
                  <span>{m.name}</span>
                  {m.required ? (
                    <span className="text-xs font-medium text-primary">Required</span>
                  ) : null}
                </li>
              ))}
          </ul>
          <Link to="/onboarding/applicability" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            View applicability
          </Link>
        </Card>
      </div>

      {!incidentsQ.data?.ok ? (
        <p className="mt-4 text-xs text-gray-500">
          Incident KPI unavailable: backend returns 501 until incident module is modelled.
        </p>
      ) : null}
    </div>
  );
}
