import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";

export default function Audit() {
  const { session, isProvider } = useApp();
  const [logs, setLogs] = useState<
    { action: string; detail: string | null; request_id: string | null; created_at: string }[]
  >([]);

  useEffect(() => {
    if (!isProvider && session.role !== "CUSTOMER_ADMIN") return;
    api(`/audit-logs?tenant_id=${session.tenantId}`).then(setLogs);
  }, [session.tenantId, isProvider, session.role]);

  if (!isProvider && session.role === "CUSTOMER_VIEWER") {
    return <PageHeader title="Audit" breadcrumb="Access denied" />;
  }

  return (
    <>
      <PageHeader title="Audit trail" breadcrumb="Operations / Audit" />
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Detail</th>
            <th>Request</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l, i) => (
            <tr key={i}>
              <td>{l.created_at}</td>
              <td>{l.action}</td>
              <td>{l.detail}</td>
              <td className="muted">{l.request_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
