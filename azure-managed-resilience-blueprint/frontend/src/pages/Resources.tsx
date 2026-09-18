import { useEffect, useState } from "react";
import { api } from "../api";

type R = {
  name: string;
  health_status: string;
  backup_protected: boolean | null;
  monthly_cost_usd: number | null;
};

export default function Resources({ tenant }: { tenant: string }) {
  const [rows, setRows] = useState<R[]>([]);
  useEffect(() => {
    api<R[]>(`/resources?tenant_id=${tenant}`).then(setRows);
  }, [tenant]);

  return (
    <>
      <h2>Infrastructure</h2>
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
              <td>{r.backup_protected ? "✓" : "✕"}</td>
              <td>${r.monthly_cost_usd ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
