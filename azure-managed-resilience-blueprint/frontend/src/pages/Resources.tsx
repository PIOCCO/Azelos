import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/UiStates";

type R = { name: string; health_status: string; backup_protected: boolean | null; monthly_cost_usd: number | null };

export default function Resources() {
  const { session } = useApp();
  const [rows, setRows] = useState<R[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const q = search ? `&search=${encodeURIComponent(search)}` : "";
    api<R[]>(`/resources?tenant_id=${session.tenantId}${q}`).then(setRows);
  }, [session.tenantId, search]);

  if (!rows.length && !search) return <LoadingState />;

  return (
    <>
      <PageHeader title="Infrastructure" breadcrumb="Overview / Infrastructure" />
      <input placeholder="Search resources…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <table>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Health</th>
            <th>Backup</th>
            <th>Cost/mo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td className={r.health_status === "healthy" ? "ok" : r.health_status === "critical" ? "bad" : "warn"}>
                {r.health_status}
              </td>
              <td>{r.backup_protected ? "Protected" : "Not protected"}</td>
              <td>${r.monthly_cost_usd ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
