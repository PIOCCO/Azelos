import { useEffect, useState } from "react";
import { api } from "../api";

export default function Alerts({ tenant }: { tenant: string }) {
  const [alerts, setAlerts] = useState<{ severity: string; title: string; message: string }[]>([]);
  useEffect(() => {
    api(`/alerts?tenant_id=${tenant}`).then(setAlerts);
  }, [tenant]);
  return (
    <>
      <h2>Active alerts</h2>
      {alerts.map((a, i) => (
        <div key={i} className="card">
          <strong className={a.severity === "CRITICAL" ? "bad" : "warn"}>{a.severity}</strong> {a.title}
          <p className="muted">{a.message}</p>
        </div>
      ))}
    </>
  );
}
