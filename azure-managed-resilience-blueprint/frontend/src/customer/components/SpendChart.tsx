import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SpendChart({ points }: { points: { day: string; amount_usd: number }[] }) {
  if (!points.length) return <p className="muted">No trend data available.</p>;
  const data = points.map((p) => ({ day: p.day.slice(8), amount: p.amount_usd }));
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
          <Line type="monotone" dataKey="amount" stroke="#60a5fa" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
