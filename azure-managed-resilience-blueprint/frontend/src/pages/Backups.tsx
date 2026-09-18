import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";

export default function Backups() {
  const { session } = useApp();
  const [data, setData] = useState<{ coverage_pct: number; items: { name: string; protected: boolean }[] } | null>(
    null,
  );
  useEffect(() => {
    api(`/backups?tenant_id=${session.tenantId}`).then(setData);
  }, [session.tenantId]);
  if (!data) return null;
  return (
    <>
      <PageHeader title="Backup protection" breadcrumb="Resilience / Backups" />
      <p className="muted">Coverage: {data.coverage_pct}%</p>
      <table>
        <tbody>
          {data.items.map((i) => (
            <tr key={i.name}>
              <td>{i.name}</td>
              <td className={i.protected ? "ok" : "bad"}>{i.protected ? "Protected" : "Not protected"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
