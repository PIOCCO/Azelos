import { useEffect, useState } from "react";
import { customerApi } from "../api";
import { ErrorState, LoadingState } from "../../components/UiStates";
import { PageHeader } from "../../components/PageHeader";
import { BudgetBar } from "../components/BudgetBar";

type Overview = {
  demo_mode: boolean;
  financial: {
    data_available: boolean;
    current_month_usd?: number;
    budget_usd?: number;
    budget_utilization_pct?: number;
    forecast_usd?: number;
    potential_savings_usd?: number;
  };
  resources_total: number;
  backup_coverage_pct: number;
  open_alerts: number;
  resilience_score: number;
};

export default function CustomerOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () =>
    customerApi<Overview>("/overview")
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Loading your Azure overview…" />;

  const fin = data.financial;
  return (
    <>
      <PageHeader title="Overview" breadcrumb="Customer" />
      {!fin.data_available && (
        <div className="state-box">
          Azure cost data is not available yet. The first synchronization may take some time.
        </div>
      )}
      <div className="grid">
        <div className="card stat">
          <span className="muted">Azure spend</span>
          <strong>{fin.data_available ? `$${fin.current_month_usd?.toFixed(2)}` : "—"}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Monthly budget</span>
          <strong>{fin.budget_usd != null ? `$${fin.budget_usd}` : "Not configured"}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Budget used</span>
          <strong>{fin.budget_utilization_pct != null ? `${fin.budget_utilization_pct}%` : "—"}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Forecast</span>
          <strong>{fin.forecast_usd != null ? `$${fin.forecast_usd}` : "Unavailable"}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Potential savings</span>
          <strong>${fin.potential_savings_usd ?? 0}/mo</strong>
        </div>
        <div className="card stat">
          <span className="muted">Resources</span>
          <strong>{data.resources_total}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Backup coverage</span>
          <strong>{data.backup_coverage_pct}%</strong>
        </div>
        <div className="card stat">
          <span className="muted">Open alerts</span>
          <strong>{data.open_alerts}</strong>
        </div>
      </div>
      {fin.data_available && fin.budget_usd != null && fin.current_month_usd != null && (
        <BudgetBar spent={fin.current_month_usd} budget={fin.budget_usd} />
      )}
      <div className="card">
        <h3>Resilience score: {data.resilience_score}/100</h3>
      </div>
    </>
  );
}
