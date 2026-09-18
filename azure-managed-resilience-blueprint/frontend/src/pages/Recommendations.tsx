import { useEffect, useState } from "react";
import { api } from "../api";

type Rec = {
  id: string;
  title: string;
  problem: string;
  evidence: string;
  suggested_action: string;
  estimated_savings_usd: number | null;
  priority: string;
  status: string;
};

export default function Recommendations({ tenant }: { tenant: string }) {
  const [rows, setRows] = useState<Rec[]>([]);
  const load = () => api<Rec[]>(`/recommendations?tenant_id=${tenant}`).then(setRows);
  useEffect(() => {
    load();
  }, [tenant]);

  const approve = async (id: string) => {
    await api(`/recommendations/${id}/approve`, { method: "POST" });
    load();
  };
  const execute = async (id: string) => {
    await api(`/recommendations/${id}/execute`, { method: "POST" });
    load();
  };

  return (
    <>
      <h2>Recommendations</h2>
      {rows.map((r) => (
        <div key={r.id} className="card">
          <h3>{r.title}</h3>
          <p>{r.problem}</p>
          <p className="muted">Evidence: {r.evidence}</p>
          <p>Suggested: {r.suggested_action}</p>
          {r.estimated_savings_usd != null && <p>Potential saving: ${r.estimated_savings_usd}/mo</p>}
          <p>
            Status: {r.status} · Priority: {r.priority}
          </p>
          {r.status === "OPEN" && (
            <button type="button" onClick={() => approve(r.id)}>
              Approve
            </button>
          )}
          {r.status === "APPROVED" && (
            <button type="button" onClick={() => execute(r.id)}>
              Execute (record action)
            </button>
          )}
        </div>
      ))}
    </>
  );
}
