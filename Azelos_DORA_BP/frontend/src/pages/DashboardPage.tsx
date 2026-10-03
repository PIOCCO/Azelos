import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchPaginated, listOrgRequirements } from "../api/dora";
import type { ICTIncident } from "../api/types";
import { getResilienceDashboard } from "../api/resilience";
import type { BusinessFunction, ICTAsset, Risk, Supplier } from "../api/types";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { Card, KpiCard } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState, LoadingSkeleton } from "../components/ui/States";
import { useTranslation } from "../i18n/LocaleContext";

export function DashboardPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { organizationId, organizationName, applicability, isLoading: orgLoading } = useOrg();
  const firstName = organizationName?.split(" ")[0] ?? "there";
  const apiReady = !!session?.token;

  const counts = useQueries({
    queries: [
      {
        queryKey: ["dash", "providers"],
        queryFn: () => fetchPaginated<Supplier>("/api/v1/ict-providers", 1, 1),
        enabled: apiReady,
      },
      {
        queryKey: ["dash", "risks"],
        queryFn: () => fetchPaginated<Risk>("/api/v1/risks", 1, 1),
        enabled: apiReady,
      },
      {
        queryKey: ["dash", "ict"],
        queryFn: () => fetchPaginated<ICTAsset>("/api/v1/ict-assets", 1, 1),
        enabled: apiReady,
      },
      {
        queryKey: ["dash", "functions"],
        queryFn: () => fetchPaginated<BusinessFunction>("/api/v1/business-functions", 1, 1),
        enabled: apiReady,
      },
    ],
  });

  const requirementsQ = useQuery({
    queryKey: ["dash-reqs"],
    queryFn: () => listOrgRequirements(organizationId!),
    enabled: apiReady && !!organizationId,
  });

  const incidentsQ = useQuery({
    queryKey: ["dash", "incidents"],
    queryFn: () => fetchPaginated<ICTIncident>("/api/v1/incidents", 1, 1),
    enabled: apiReady,
  });

  const resilienceQ = useQuery({
    queryKey: ["dash-resilience"],
    queryFn: getResilienceDashboard,
    enabled: apiReady && !!organizationId,
  });

  if (orgLoading || counts.some((q) => q.isLoading)) {
    return (
      <div>
        <PageHeader title={t("dashboard.title")} />
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
        title={t("dashboard.title")}
        subtitle={`${t("dashboard.welcome", { name: firstName })} ${t("dashboard.orgLine", { org: organizationName ?? "—" })}`}
      />

      {providers === 0 && functions === 0 ? (
        <div className="mb-6 rounded-lg border border-primary/30 bg-blue-50 px-4 py-3 text-sm text-gray-800">
          <p className="font-medium">{t("dashboard.firstTimeTitle")}</p>
          <p className="mt-1 text-gray-700">
            {t("dashboard.firstTimePrefix")}{" "}
            <Link to="/onboarding" className="font-medium text-primary hover:underline">
              {t("dashboard.getStartedLink")}
            </Link>{" "}
            {t("dashboard.firstTimeMid")}{" "}
            <Link to="/business-functions" className="text-primary hover:underline">
              {t("dashboard.businessFunctionsLink")}
            </Link>{" "}
            {t("dashboard.firstTimeAnd")}{" "}
            <Link to="/ict-providers" className="text-primary hover:underline">
              {t("dashboard.ictProvidersLink")}
            </Link>
            .
          </p>
        </div>
      ) : null}

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900">{t("dashboard.resilienceHeading")}</h2>
        <p className="text-sm text-gray-500">{t("dashboard.resilienceSub")}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label={t("dashboard.kpiCriticalServices")}
          value={resilienceQ.data?.critical_business_services ?? "—"}
          tone="primary"
        />
        <KpiCard
          label={t("dashboard.kpiServicesWithGaps")}
          value={resilienceQ.data?.services_with_gaps ?? "—"}
          tone="warning"
        />
        <KpiCard label={t("dashboard.kpiHighFindings")} value={resilienceQ.data?.high_findings ?? "—"} tone="danger" />
        <KpiCard label={t("dashboard.kpiCloudResources")} value={resilienceQ.data?.cloud_resources ?? "—"} />
        <KpiCard label={t("dashboard.kpiOpenRemediations")} value={resilienceQ.data?.open_remediations ?? "—"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label={t("dashboard.kpiIctProviders")} value={providers} />
        <KpiCard label={t("dashboard.kpiIctAssets")} value={ictAssets} />
        <KpiCard label={t("dashboard.kpiOpenRisks")} value={risks} tone="warning" />
        <KpiCard label={t("dashboard.kpiBusinessFunctions")} value={functions} />
        <KpiCard label={t("dashboard.kpiIncidents")} value={incidentsQ.data?.total ?? "—"} tone="danger" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title={t("dashboard.actionCenter")} className="lg:col-span-1">
          <ul className="space-y-4 text-sm">
            {risks > 0 ? (
              <li>
                <span className="font-semibold text-red-600">{t("status.high")}</span>
                <p className="text-gray-700">
                  {risks} {t("pages.risks.title").toLowerCase()}.
                </p>
                <Link to="/risks" className="text-primary text-sm font-medium hover:underline">
                  {t("dashboard.reviewRisks")}
                </Link>
              </li>
            ) : (
              <li className="text-gray-500">{t("dashboard.noRisks")}</li>
            )}
            {applicability?.requirements_hint?.slice(0, 2).map((code) => (
              <li key={code}>
                <span className="font-semibold text-amber-600">{t("dashboard.hint")}</span>
                <p className="text-gray-700">{t("dashboard.requirementHint", { code })}</p>
                <Link to="/requirements" className="text-primary text-sm font-medium hover:underline">
                  {t("dashboard.viewRequirements")}
                </Link>
              </li>
            )) ?? null}
          </ul>
        </Card>

        <Card title={t("dashboard.reqImplementation")} className="lg:col-span-1">
          {requirementsQ.isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : reqs.length === 0 ? (
            <p className="text-sm text-gray-500">{t("dashboard.noRequirements")}</p>
          ) : (
            <div className="flex items-center gap-6">
              <div
                className="relative h-28 w-28 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(#2563eb 0 ${(implemented / reqs.length) * 100}%, #93c5fd ${(implemented / reqs.length) * 100}% ${((implemented + partial) / reqs.length) * 100}%, #e5e7eb ${((implemented + partial) / reqs.length) * 100}% 100%)`,
                }}
                role="img"
                aria-label={t("dashboard.chartAria", {
                  implemented,
                  partial,
                  notStarted,
                })}
              />
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-primary mr-2" />
                  {t("dashboard.implemented")}: {implemented}
                </li>
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-300 mr-2" />
                  {t("dashboard.partial")}: {partial}
                </li>
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-gray-300 mr-2" />
                  {t("dashboard.otherNotStarted")}: {notStarted}
                </li>
              </ul>
            </div>
          )}
        </Card>

        <Card title={t("dashboard.enabledModules")} className="lg:col-span-1">
          <ul className="space-y-2 text-sm text-gray-700">
            {(applicability?.modules ?? [])
              .filter((m) => m.enabled && m.applicable)
              .slice(0, 8)
              .map((m) => (
                <li key={m.key} className="flex justify-between gap-2">
                  <span>{m.name}</span>
                  {m.required ? (
                    <span className="text-xs font-medium text-primary">{t("dashboard.required")}</span>
                  ) : null}
                </li>
              ))}
          </ul>
          <Link
            to="/onboarding/applicability"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.viewApplicability")}
          </Link>
        </Card>
      </div>
    </div>
  );
}
