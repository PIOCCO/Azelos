import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";

type AlertRow = {
  id: string;
  severity: string;
  category: string;
  status: string;
  title: string;
  message: string;
};

export default function Alerts() {
  const { session } = useApp();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [severity, setSeverity] = useState("");
  const load = () => {
    const q = severity ? `&severity=${severity}` : "";
    return api<AlertRow[]>(`/alerts?tenant_id=${session.tenantId}${q}`).then(setAlerts);
  };
  useEffect(() => {
    load();
  }, [session.tenantId, severity]);

  const ack = async (id: string) => {
    await api(`/alerts/${id}/acknowledge`, { method: "POST" });
    load();
  };
  const resolve = async (id: string) => {
    await api(`/alerts/${id}/resolve`, { method: "POST" });
    load();
  };

  return (
    <>
      <PageHeader title="Alerts" breadcrumb="Operations / Alerts" />
      <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
        <option value="">All severities</option>
        <option value="CRITICAL">Critical</option>
        <option value="WARNING">Warning</option>
        <option value="INFO">Info</option>
      </select>
      {alerts.length === 0 && <p className="muted">No active alerts.</p>}
      {alerts.map((a) => (
        <div key={a.id} className="card">
          <strong className={a.severity === "CRITICAL" ? "bad" : "warn"}>
            {a.severity} · {a.category}
          </strong>{" "}
          {a.title}
          <p className="muted">{a.message}</p>
          <p className="muted">Status: {a.status}</p>
          {a.status === "OPEN" && (
            <button type="button" onClick={() => ack(a.id)}>
              Acknowledge
            </button>
          )}
          {a.status !== "RESOLVED" && (
            <button type="button" onClick={() => resolve(a.id)}>
              Resolve
            </button>
          )}
        </div>
      ))}
    </>
  );
}
