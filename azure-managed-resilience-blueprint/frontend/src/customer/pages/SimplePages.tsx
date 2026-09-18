import { useEffect, useState } from "react";
import { customerApi } from "../api";
import { PageHeader } from "../../components/PageHeader";

export function ResiliencePage() {
  const [score, setScore] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    customerApi("/resilience").then(setScore);
  }, []);
  if (!score) return null;
  return (
    <>
      <PageHeader title="Resilience" breadcrumb="Resilience" />
      <div className="card">
        <h3>Score: {String(score.score)}/100</h3>
        <ul>
          {Object.entries((score.factors as Record<string, number>) || {}).map(([k, v]) => (
            <li key={k}>
              {k.replaceAll("_", " ")}: {v}%
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function BackupsPage() {
  const [b, setB] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    customerApi("/backups").then(setB);
  }, []);
  if (!b) return null;
  return (
    <>
      <PageHeader title="Backups" breadcrumb="Resilience / Backups" />
      <p>
        Coverage: {String(b.coverage_pct)}% ({String(b.protected_count)}/{String(b.total)})
      </p>
    </>
  );
}

export function DRPage() {
  const [dr, setDr] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    customerApi("/dr").then(setDr);
  }, []);
  if (!dr) return null;
  return (
    <>
      <PageHeader title="Disaster recovery" breadcrumb="Resilience / DR" />
      <p>Protected workloads: {String(dr.protected_vms)}</p>
      <p>Last DR test: {String(dr.last_dr_test ?? "Not recorded")}</p>
    </>
  );
}

export function SecurityPage() {
  const [sec, setSec] = useState<{ counts: Record<string, number>; findings: { title: string; severity: string }[] } | null>(
    null,
  );
  useEffect(() => {
    customerApi("/security").then(setSec);
  }, []);
  if (!sec) return null;
  return (
    <>
      <PageHeader title="Security" breadcrumb="Security" />
      <pre>{JSON.stringify(sec.counts, null, 2)}</pre>
      <ul>
        {sec.findings.map((f, i) => (
          <li key={i}>
            [{f.severity}] {f.title}
          </li>
        ))}
      </ul>
    </>
  );
}

export function CustomerAlerts() {
  const [alerts, setAlerts] = useState<{ id: string; severity: string; title: string; status: string }[]>([]);
  useEffect(() => {
    customerApi("/alerts").then(setAlerts);
  }, []);
  return (
    <>
      <PageHeader title="Alerts" breadcrumb="Operations / Alerts" />
      {alerts.map((a) => (
        <div key={a.id} className="card">
          [{a.severity}] {a.title} — {a.status}
        </div>
      ))}
    </>
  );
}

export function CustomerRecommendations() {
  const [items, setItems] = useState<{ id: string; title: string; status: string }[]>([]);
  useEffect(() => {
    customerApi<{ opportunities: { id: string; title: string; status: string }[] }>("/recommendations").then((d) =>
      setItems(d.opportunities || []),
    );
  }, []);
  return (
    <>
      <PageHeader title="Recommendations" breadcrumb="Operations / Recommendations" />
      {items.map((i) => (
        <div key={i.id} className="card">
          {i.title} — {i.status}
        </div>
      ))}
    </>
  );
}

export function CustomerReports() {
  const [md, setMd] = useState("");
  return (
    <>
      <PageHeader title="Reports" breadcrumb="Operations / Reports" />
      <button type="button" onClick={() => customerApi<{ markdown: string }>("/reports/monthly").then((d) => setMd(d.markdown))}>
        Generate monthly report
      </button>
      {md && <pre className="card">{md}</pre>}
    </>
  );
}

export function CustomerSettings() {
  const [s, setS] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    customerApi("/settings").then(setS);
  }, []);
  if (!s) return null;
  return (
    <>
      <PageHeader title="Settings" breadcrumb="Settings" />
      <div className="card">
        <p>Company: {String(s.company_name)}</p>
        <p>Subscription: {String(s.azure_subscription_id || "—")}</p>
        <p>Budget: {s.monthly_budget_usd != null ? `$${s.monthly_budget_usd}` : "Not configured"}</p>
      </div>
    </>
  );
}
