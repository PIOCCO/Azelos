import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";

type Rec = {
  id: string;
  title: string;
  category: string;
  problem: string;
  evidence: string;
  suggested_action: string;
  expected_benefit: string | null;
  rollback_info: string | null;
  estimated_savings_usd: number | null;
  priority: string;
  status: string;
};

export default function Recommendations() {
  const { session } = useApp();
  const [rows, setRows] = useState<Rec[]>([]);
  const load = () => api<Rec[]>(`/recommendations?tenant_id=${session.tenantId}`).then(setRows);
  useEffect(() => {
    load();
  }, [session.tenantId]);

  const approve = async (id: string) => {
    if (!window.confirm("Approve this recommendation for execution?")) return;
    await api(`/recommendations/${id}/approve`, { method: "POST" });
    load();
  };
  const execute = async (id: string) => {
    if (!window.confirm("Record execution in audit log? No automatic Azure changes will be made.")) return;
    await api(`/recommendations/${id}/execute`, { method: "POST" });
    load();
  };

  return (
    <>
      <PageHeader title="Recommendations" breadcrumb="Operations / Recommendations" />
      {rows.map((r) => (
        <div key={r.id} className="card">
          <h3>
            {r.title} <span className="muted">({r.category})</span>
          </h3>
          <p>{r.problem}</p>
          <p className="muted">Evidence: {r.evidence}</p>
          <p>Action: {r.suggested_action}</p>
          {r.expected_benefit && <p>Benefit: {r.expected_benefit}</p>}
          {r.rollback_info && <p className="muted">Rollback: {r.rollback_info}</p>}
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
              Execute (record)
            </button>
          )}
        </div>
      ))}
    </>
  );
}
