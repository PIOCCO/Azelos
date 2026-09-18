import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { ErrorState, LoadingState } from "../components/UiStates";
import { PageHeader } from "../components/PageHeader";

type Overview = {
  resources_total: number;
  healthy: number;
  warnings: number;
  critical: number;
  backup_coverage_pct: number;
  dr_readiness: number;
  security_findings: Record<string, number>;
  monthly_cost_usd: number | null;
  potential_savings_usd: number;
  forecast_usd: number | null;
  budget_usd: number;
  budget_utilization_pct: number | null;
  resilience: { score: number; factors: Record<string, number>; weights: Record<string, number> };
  sync: { last_status: string | null; last_duration_seconds: number | null; last_completed_at: string | null };
  operational_issues: { critical_alerts: number; backup_gaps: number; security_high_critical: number };
  recent_alerts: { severity: string; title: string; category: string }[];
  top_recommendations: { title: string; priority: string; category: string; status: string }[];
};

export default function Dashboard() {
  const { session, meta } = useApp();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    api<Overview>(`/dashboard/overview?tenant_id=${session.tenantId}`)
      .then(setData)
      .catch((e) => setError(e.message));
  };

  useEffect(load, [session.tenantId]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Loading operational overview…" />;

  const secTotal = Object.values(data.security_findings).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader title="Operations overview" breadcrumb="Overview" />
      <div className="grid">
        {[
          ["Resources", data.resources_total],
          ["Healthy", data.healthy],
          ["Warnings", data.warnings],
          ["Critical", data.critical],
          ["Backup coverage", `${data.backup_coverage_pct}%`],
          ["DR readiness", data.dr_readiness],
          ["Security findings", secTotal],
          ["Monthly cost", `$${data.monthly_cost_usd ?? 0}`],
          ["Potential savings", `$${data.potential_savings_usd}/mo`],
        ].map(([label, val]) => (
          <div key={String(label)} className="card stat">
            <span className="muted">{label}</span>
            <strong>{val}</strong>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Resilience score: {data.resilience.score}/100</h3>
        <ul className="factor-list">
          {Object.entries(data.resilience.factors).map(([k, v]) => (
            <li key={k}>
              {k.replaceAll("_", " ")} — {v}% (weight {data.resilience.weights[k]})
            </li>
          ))}
        </ul>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Operational health</h3>
          <p>Critical alerts: {data.operational_issues.critical_alerts}</p>
          <p>Backup gaps: {data.operational_issues.backup_gaps}</p>
          <p>High/critical security: {data.operational_issues.security_high_critical}</p>
          <ul>
            {data.recent_alerts.map((a, i) => (
              <li key={i}>
                [{a.severity}] {a.title} <span className="muted">({a.category})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>FinOps</h3>
          <p>
            Spend ${data.monthly_cost_usd ?? 0} · Forecast ${data.forecast_usd ?? "—"} · Budget ${data.budget_usd}
          </p>
          <p>Utilization: {data.budget_utilization_pct ?? "—"}%</p>
        </div>
      </div>

      <div className="card">
        <h3>Priority recommendations</h3>
        {data.top_recommendations.length === 0 ? (
          <p className="muted">No open recommendations — run discovery sync.</p>
        ) : (
          <ul>
            {data.top_recommendations.map((r, i) => (
              <li key={i}>
                <strong>{r.priority}</strong> · {r.title} — {r.category} ({r.status})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Synchronization</h3>
        <p>Last status: {data.sync.last_status ?? "Never"}</p>
        <p>Last completed: {data.sync.last_completed_at ?? "—"}</p>
        <p>Duration: {data.sync.last_duration_seconds ?? "—"}s</p>
        {meta?.sync_schedule_cron && <p className="muted">Scheduled: {meta.sync_schedule_cron} UTC</p>}
      </div>
    </>
  );
}
