import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi } from "../api";
import { PageHeader } from "../../components/PageHeader";

export default function CustomerInfrastructure() {
  const [rows, setRows] = useState<
    { id: string; name: string; resource_type: string; health_status: string; monthly_cost_usd: number | null }[]
  >([]);
  useEffect(() => {
    customerApi<{ resources: typeof rows }>("/infrastructure").then((d) => setRows(d.resources));
  }, []);
  return (
    <>
      <PageHeader title="Infrastructure" breadcrumb="Operations" />
      <table>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Type</th>
            <th>Health</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link to={`/customer/infrastructure/${r.id}`}>{r.name}</Link>
              </td>
              <td>{r.resource_type.split("/").pop()}</td>
              <td>{r.health_status}</td>
              <td>{r.monthly_cost_usd != null ? `$${r.monthly_cost_usd}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
