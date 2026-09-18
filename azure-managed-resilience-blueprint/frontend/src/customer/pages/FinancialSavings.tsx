import { useEffect, useState } from "react";
import { customerApi } from "../api";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState } from "../../components/UiStates";

export default function FinancialSavings() {
  const [items, setItems] = useState<
    {
      id: string;
      title: string;
      estimated_savings_usd: number | null;
      problem: string;
      evidence: string;
      suggested_action: string;
      status: string;
    }[]
  >([]);
  useEffect(() => {
    customerApi<{ opportunities: typeof items }>("/financial/savings").then((d) => setItems(d.opportunities || []));
  }, []);
  if (!items.length) return <LoadingState label="No savings opportunities yet." />;
  return (
    <>
      <PageHeader title="Savings opportunities" breadcrumb="Financial / Savings" />
      {items.map((i) => (
        <div key={i.id} className="card">
          <h3>{i.title}</h3>
          <p>{i.problem}</p>
          <p className="muted">Evidence: {i.evidence}</p>
          {i.estimated_savings_usd != null && <p>Estimated savings: ${i.estimated_savings_usd}/month</p>}
          <p>Suggested action: {i.suggested_action}</p>
          <p>Status: {i.status}</p>
        </div>
      ))}
    </>
  );
}
