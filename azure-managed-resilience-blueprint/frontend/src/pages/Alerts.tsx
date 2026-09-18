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
  const load = () => api<AlertRow[]>(`/alerts?tenant_id=${session.tenantId}`).then(setAlerts);
  useEffect(() => {
    load();
  }, [session.tenantId]);

  const ack = async (id: string) => {
    await api(`/alerts/${id}/acknowledge`, { method: "POST" });
    load();
  };

  return (
    <>
      <PageHeader title="Alerts" breadcrumb="Operations / Alerts" />
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
        </div>
      ))}
    </>
  );
}
