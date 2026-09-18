import { useState } from "react";
import { api, getToken } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";

export default function Reports() {
  const { session } = useApp();
  const [md, setMd] = useState("");

  const generate = async () => {
    const data = await api<{ markdown: string }>(`/reports/monthly?tenant_id=${session.tenantId}`);
    setMd(data.markdown);
  };

  const pdf = () => {
    const base = import.meta.env.VITE_API_BASE || "/api/v1";
    window.open(`${base}/reports/monthly?tenant_id=${session.tenantId}&format=pdf`, "_blank");
  };

  return (
    <>
      <PageHeader title="Reports" breadcrumb="Operations / Reports" />
      <button type="button" onClick={generate}>
        Generate monthly report
      </button>{" "}
      <button type="button" onClick={pdf} disabled={!getToken()}>
        Export PDF
      </button>
      {md && (
        <pre className="card report-body" style={{ whiteSpace: "pre-wrap" }}>
          {md}
        </pre>
      )}
    </>
  );
}
