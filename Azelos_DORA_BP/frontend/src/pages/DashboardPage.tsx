import { useQueries } from "@tanstack/react-query";
import { fetchPaginated } from "../api/dora";
import type { BusinessFunction, ICTAsset, Risk, Supplier } from "../api/types";
import { useOrg } from "../contexts/OrgContext";
import { LoadingPanel, ErrorPanel } from "../components/ui/StatePanel";

export function DashboardPage() {
  const { applicability, isLoading: orgLoading } = useOrg();

  const queries = useQueries({
    queries: [
      { queryKey: ["dash", "providers"], queryFn: () => fetchPaginated<Supplier>("/api/v1/ict-providers", 1, 1) },
      { queryKey: ["dash", "risks"], queryFn: () => fetchPaginated<Risk>("/api/v1/risks", 1, 1) },
      { queryKey: ["dash", "functions"], queryFn: () => fetchPaginated<BusinessFunction>("/api/v1/business-functions", 1, 1) },
      { queryKey: ["dash", "ict"], queryFn: () => fetchPaginated<ICTAsset>("/api/v1/ict-assets", 1, 1) },
    ],
  });

  if (orgLoading) return <LoadingPanel />;
  const anyError = queries.find((q) => q.error);
  if (anyError?.error) {
    return <ErrorPanel message={(anyError.error as Error).message} />;
  }

  const [providers, risks, functions, ict] = queries.map((q) => q.data?.total ?? 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Counts from paginated API totals (page size 1). No client-side regulatory calculations.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "ICT providers", value: providers },
          { label: "Risk assessments", value: risks },
          { label: "Business functions", value: functions },
          { label: "ICT assets", value: ict },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
      {applicability ? (
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium">Applicability snapshot</h2>
          <p className="mt-2 text-sm text-slate-600">
            Matched rules: {applicability.rules.length ? applicability.rules.join(", ") : "none"}
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
            {applicability.modules
              .filter((m) => m.enabled && m.applicable)
              .slice(0, 6)
              .map((m) => (
                <li key={m.key}>
                  {m.name} {m.required ? "(required)" : ""}
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
