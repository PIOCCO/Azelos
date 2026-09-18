import { useEffect, useState } from "react";
import { api } from "../api";

export default function Backups({ tenant }: { tenant: string }) {
  const [data, setData] = useState<{ coverage_pct: number; items: { name: string; protected: boolean }[] } | null>(null);
  useEffect(() => {
    api(`/backups?tenant_id=${tenant}`).then(setData);
  }, [tenant]);
  if (!data) return null;
  return (
    <>
      <h2>Backup coverage: {data.coverage_pct}%</h2>
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
