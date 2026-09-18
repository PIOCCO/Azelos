import { useEffect, useState } from "react";
import { customerApi } from "../api";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState, ErrorState } from "../../components/UiStates";
import { BudgetBar } from "../components/BudgetBar";

export default function FinancialOverview() {
  const [fin, setFin] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    customerApi("/financial/summary")
      .then(setFin)
      .catch((e) => setError(e.message));
  }, []);
  if (error) return <ErrorState message={error} />;
  if (!fin) return <LoadingState />;
  if (!fin.data_available) return <PageHeader title="Financial overview" breadcrumb="Financial" />;
  return (
    <>
      <PageHeader title="Financial overview" breadcrumb="Financial" />
      <div className="card">
        <h3>Current month</h3>
        <strong>${Number(fin.current_month_usd).toFixed(2)}</strong>
        {fin.month_over_month_pct != null && (
          <p className="muted">vs previous month: {Number(fin.month_over_month_pct) > 0 ? "+" : ""}{String(fin.month_over_month_pct)}%</p>
        )}
      </div>
      {fin.budget_configured && (
        <BudgetBar spent={Number(fin.current_month_usd)} budget={Number(fin.budget_usd)} />
      )}
    </>
  );
}
