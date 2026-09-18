import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";

export default function FinOps() {
  const { session } = useApp();
  const [costs, setCosts] = useState<{
    current_month_usd: number;
    forecast_usd: number | null;
    budget_usd: number;
    budget_utilization_pct: number | null;
    by_resource: { name: string; monthly_cost_usd: number }[];
  } | null>(null);
  useEffect(() => {
    api(`/costs?tenant_id=${session.tenantId}`).then(setCosts);
  }, [session.tenantId]);
  if (!costs) return null;
  return (
    <>
      <PageHeader title="FinOps" breadcrumb="FinOps" />
      <div className="grid">
        <div className="card stat">
          Current month<strong>${costs.current_month_usd}</strong>
        </div>
        <div className="card stat">
          Forecast<strong>${costs.forecast_usd ?? 0}</strong>
        </div>
        <div className="card stat">
          Budget utilization<strong>{costs.budget_utilization_pct ?? 0}%</strong>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Monthly</th>
          </tr>
        </thead>
        <tbody>
          {costs.by_resource.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td>${r.monthly_cost_usd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
