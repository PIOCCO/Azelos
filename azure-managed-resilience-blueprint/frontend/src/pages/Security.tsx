import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";

export default function Security() {
  const { session } = useApp();
  const [findings, setFindings] = useState<{ severity: string; title: string; evidence: string }[]>([]);
  useEffect(() => {
    api<{ findings: typeof findings }>(`/security?tenant_id=${session.tenantId}`).then((d) => setFindings(d.findings));
  }, [session.tenantId]);
  return (
    <>
      <PageHeader title="Security posture" breadcrumb="Security" />
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
