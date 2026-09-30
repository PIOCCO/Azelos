import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDoraOverview } from "../../api/doraOverview";
import { useAuth } from "../../contexts/AuthContext";
import { useOrg } from "../../contexts/OrgContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, KpiCard } from "../../components/ui/Card";
import { LoadingSkeleton, ErrorState } from "../../components/ui/States";

function ModuleLink({
  to,
  label,
  detail,
}: {
  to: string;
  label: string;
  detail: string;
}) {
  return (
    <li className="rounded-lg border border-gray-100 px-3 py-2 hover:border-primary/30">
      <Link to={to} className="font-medium text-primary hover:underline">
        {label}
      </Link>
      <p className="mt-0.5 text-xs text-gray-600">{detail}</p>
    </li>
  );
}

export function DoraHubPage() {
  const { session } = useAuth();
  useOrg();
  const q = useQuery({
    queryKey: ["dora-overview"],
    queryFn: getDoraOverview,
    enabled: !!session?.token,
  });

  if (q.isLoading) return <LoadingSkeleton rows={8} />;
  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;

  const o = q.data!;
  const r = o.resilience;

  return (
    <div>
      <PageHeader
        title="DORA Overview"
        subtitle="Operational resilience posture from live tenant data — trace dependencies in the Relationship Map."
      />

      <section className="mb-2">
        <h2 className="text-sm font-semibold text-gray-900">ICT risk & dependencies</h2>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Critical business functions" value={o.business_functions_critical} tone="primary" />
        <KpiCard label="High/critical ICT assets" value={o.ict_assets_high_criticality} />
        <KpiCard label="Critical ICT services" value={o.ict_services_critical} />
        <KpiCard
          label="High/critical risk assessments"
          value={o.risk_assessments_high_or_critical}
          tone="warning"
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="ICT providers" value={o.ict_providers_total} />
        <KpiCard label="Total risk assessments" value={o.risk_assessments_total} />
        <KpiCard label="Business functions (all)" value={o.business_functions_total} />
        <KpiCard label="ICT assets (all)" value={o.ict_assets_total} />
      </div>

      <section className="mb-2 mt-8">
        <h2 className="text-sm font-semibold text-gray-900">Incidents & resilience operations</h2>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open findings"
          value={r.open_findings}
          tone={r.open_findings > 0 ? "warning" : "default"}
        />
        <KpiCard label="High/critical findings" value={r.high_findings} tone="danger" />
        <KpiCard label="Open remediations" value={r.open_remediations} />
        <Link to="/incidents" className="block">
          <KpiCard label="Open incidents" value={o.incidents_open} tone={o.incidents_open ? "warning" : "default"} />
        </Link>
        <Link to="/incidents" className="block">
          <KpiCard label="Major incidents (open)" value={o.incidents_major_open} tone="danger" />
        </Link>
      </div>

      <section className="mb-2 mt-8">
        <h2 className="text-sm font-semibold text-gray-900">Testing & continuity</h2>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Recovery tests passed" value={r.recovery_tests_passed} tone="primary" />
        <KpiCard label="Recovery tests failed" value={r.recovery_tests_failed} tone="danger" />
        <KpiCard label="Recovery tests not run" value={r.recovery_tests_not_run} />
        <KpiCard label="Services with resilience gaps" value={r.services_with_gaps} tone="warning" />
        <KpiCard label="Critical business services" value={r.critical_business_services} />
      </div>

      <section className="mb-2 mt-8">
        <h2 className="text-sm font-semibold text-gray-900">Compliance & evidence</h2>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Evidence items" value={o.evidence_items_total} />
        <KpiCard label="DORA controls implemented" value={r.dora_implemented} tone="primary" />
        <KpiCard label="Partial" value={r.dora_partial} tone="warning" />
        <KpiCard label="Not implemented" value={r.dora_not_implemented} tone="danger" />
        <KpiCard label="Insufficient evidence" value={r.dora_insufficient_evidence} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/remediation" className="block">
          <KpiCard label="Overdue remediations" value={o.overdue_remediations} tone="danger" />
        </Link>
        <Link to="/evidence" className="block">
          <KpiCard label="Evidence expiring (30d)" value={o.evidence_expiring_within_30_days} tone="warning" />
        </Link>
        <Link to="/resilience-tests" className="block">
          <KpiCard label="Planned resilience tests" value={o.resilience_tests_planned} />
        </Link>
        <Link to="/tlpt" className="block">
          <KpiCard label="Active TLPT exercises" value={o.tlpt_exercises_active} />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Navigate the dependency chain">
          <ul className="space-y-2 text-sm">
            <ModuleLink
              to="/dora/relationship-map"
              label="Relationship Map"
              detail="Business functions → assets → suppliers → risks → findings (live graph)"
            />
            <ModuleLink
              to="/business-functions"
              label="Business functions"
              detail="Critical functions and ICT mappings"
            />
            <ModuleLink to="/ict-assets" label="ICT assets" detail="Inventory linked to functions and suppliers" />
            <ModuleLink to="/ict-providers" label="Third-party providers" detail="Concentration and contract context" />
            <ModuleLink to="/risks" label="ICT risk register" detail="Assessments with supplier and service traceability" />
          </ul>
        </Card>
        <Card title="Remediation & assurance">
          <ul className="space-y-2 text-sm">
            <ModuleLink to="/findings" label="Findings" detail={`${r.open_findings} open from API`} />
            <ModuleLink to="/remediation" label="Remediation" detail={`${r.open_remediations} open actions`} />
            <ModuleLink to="/recovery-tests" label="Recovery tests" detail="DR/BCP test outcomes vs RTO/RPO" />
            <ModuleLink to="/requirements" label="Regulatory requirements" detail="Organization baseline" />
            <ModuleLink to="/evidence" label="Evidence" detail={`${o.evidence_items_total} uploaded items`} />
          </ul>
        </Card>
      </div>
    </div>
  );
}
