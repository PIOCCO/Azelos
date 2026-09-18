import { useEffect, useState } from "react";
import { customerApi } from "../api";
import { PageHeader } from "../../components/PageHeader";
import { SpendChart } from "../components/SpendChart";
import { LoadingState } from "../../components/UiStates";

export default function FinancialTrends() {
  const [points, setPoints] = useState<{ day: string; amount_usd: number }[]>([]);
  const [days, setDays] = useState(30);
  useEffect(() => {
    customerApi<{ points: typeof points }>(`/financial/trends?days=${days}`).then((d) => setPoints(d.points || []));
  }, [days]);
  if (!points.length) return <LoadingState />;
  return (
    <>
      <PageHeader title="Cost trends" breadcrumb="Financial / Trends" />
      <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
        <option value={7}>7 days</option>
        <option value={30}>30 days</option>
        <option value={90}>90 days</option>
      </select>
      <div className="card">
        <h3>Daily Azure spend</h3>
        <SpendChart points={points} />
      </div>
    </>
  );
}
