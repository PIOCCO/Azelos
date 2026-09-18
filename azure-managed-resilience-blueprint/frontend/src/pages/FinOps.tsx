import { useEffect, useState } from "react";
import { api } from "../api";

export default function FinOps({ tenant }: { tenant: string }) {
  const [costs, setCosts] = useState<{
    current_month_usd: number;
    forecast_usd: number | null;
    budget_usd: number;
    by_resource: { name: string; monthly_cost_usd: number }[];
  } | null>(null);
  useEffect(() => {
    api(`/costs?tenant_id=${tenant}`).then(setCosts);
  }, [tenant]);
  if (!costs) return null;
  return (
    <>
      <h2>FinOps</h2>
      <div className="grid">
        <div className="card stat">
          Current month<strong>${costs.current_month_usd}</strong>
        </div>
        <div className="card stat">
          Forecast<strong>${costs.forecast_usd ?? 0}</strong>
        </div>
        <div className="card stat">
          Budget<strong>${costs.budget_usd}</strong>
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
