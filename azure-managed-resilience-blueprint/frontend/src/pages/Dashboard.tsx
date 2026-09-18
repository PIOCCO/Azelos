import { useEffect, useState } from "react";
import { api } from "../api";

type Overview = {
  resources_total: number;
  healthy: number;
  warnings: number;
  critical: number;
  backup_coverage_pct: number;
  security_findings: Record<string, number>;
  monthly_cost_usd: number | null;
  potential_savings_usd: number;
  forecast_usd: number | null;
  budget_usd: number;
};

export default function Dashboard({ tenant }: { tenant: string }) {
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => {
    api<Overview>(`/dashboard/overview?tenant_id=${tenant}`).then(setData);
  }, [tenant]);

  if (!data) return <p>Loading…</p>;

  return (
    <>
      <h2>Azure Environment</h2>
      <div className="grid">
        <div className="card stat">
          <span className="muted">Resources</span>
          <strong>{data.resources_total}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Healthy</span>
          <strong className="ok">{data.healthy}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Warnings</span>
          <strong className="warn">{data.warnings}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Critical</span>
          <strong className="bad">{data.critical}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Backup coverage</span>
          <strong>{data.backup_coverage_pct}%</strong>
        </div>
        <div className="card stat">
          <span className="muted">Monthly cost</span>
          <strong>${data.monthly_cost_usd ?? 0}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Potential savings</span>
          <strong>${data.potential_savings_usd}/mo</strong>
        </div>
      </div>
      <div className="card">
        <h3>Security findings</h3>
        <pre>{JSON.stringify(data.security_findings, null, 2)}</pre>
        <p className="muted">Forecast ${data.forecast_usd ?? "n/a"} · Budget ${data.budget_usd}</p>
      </div>
    </>
  );
}
