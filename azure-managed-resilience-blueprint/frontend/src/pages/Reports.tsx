import { useState } from "react";
import { api } from "../api";

export default function Reports({ tenant }: { tenant: string }) {
  const [md, setMd] = useState("");

  const generate = async () => {
    const data = await api<{ markdown: string }>(`/reports/monthly?tenant_id=${tenant}&format=json`);
    setMd(data.markdown);
  };

  const pdf = () => {
    window.open(`/api/v1/reports/monthly?tenant_id=${tenant}&format=pdf`, "_blank");
  };

  return (
    <>
      <h2>Monthly report</h2>
      <button type="button" onClick={generate}>
        Generate report
      </button>{" "}
      <button type="button" onClick={pdf}>
        Export PDF
      </button>
      {md && (
        <pre className="card" style={{ whiteSpace: "pre-wrap" }}>
          {md}
        </pre>
      )}
    </>
  );
}
