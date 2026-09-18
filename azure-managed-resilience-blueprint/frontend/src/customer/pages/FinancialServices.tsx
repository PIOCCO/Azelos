import { useEffect, useState } from "react";
import { customerApi } from "../api";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState } from "../../components/UiStates";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];

export default function FinancialServices() {
  const [data, setData] = useState<{ services: { service_name: string; amount_usd: number; share_pct: number }[] } | null>(
    null,
  );
  useEffect(() => {
    customerApi("/financial/services").then(setData);
  }, []);
  if (!data) return <LoadingState />;
  return (
    <>
      <PageHeader title="Cost by service" breadcrumb="Financial / Services" />
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Cost</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {data.services?.map((s) => (
            <tr key={s.service_name}>
              <td>{s.service_name}</td>
              <td>${s.amount_usd.toFixed(2)}</td>
              <td>{s.share_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="card" style={{ height: 280 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data.services} dataKey="amount_usd" nameKey="service_name" outerRadius={90}>
              {data.services.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
