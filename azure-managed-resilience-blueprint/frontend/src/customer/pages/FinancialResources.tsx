import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi } from "../api";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState } from "../../components/UiStates";

export default function FinancialResources() {
  const [rows, setRows] = useState<{ id: string; name: string; resource_type: string; amount_usd: number }[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    customerApi<{ resources: typeof rows }>("/financial/resources").then((d) => setRows(d.resources || []));
  }, []);
  if (!rows.length) return <LoadingState />;
  const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Cost by resource" breadcrumb="Financial / Resources" />
      <input placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} />
      <table>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Type</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td>
                <Link to={`/customer/infrastructure/${r.id}`}>{r.name}</Link>
              </td>
              <td>{r.resource_type.split("/").pop()}</td>
              <td>${r.amount_usd.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
