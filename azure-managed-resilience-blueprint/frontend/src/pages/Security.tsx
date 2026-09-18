import { useEffect, useState } from "react";
import { api } from "../api";

export default function Security({ tenant }: { tenant: string }) {
  const [findings, setFindings] = useState<{ severity: string; title: string; evidence: string }[]>([]);
  useEffect(() => {
    api<{ findings: typeof findings }>(`/security?tenant_id=${tenant}`).then((d) => setFindings(d.findings));
  }, [tenant]);
  return (
    <>
      <h2>Security posture</h2>
      <ul>
        {findings.map((f, i) => (
          <li key={i}>
            <strong>{f.severity}</strong> — {f.title} <span className="muted">({f.evidence})</span>
          </li>
        ))}
      </ul>
    </>
  );
}
