import { useState } from "react";
import { apiRequest } from "../../api/client";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";

const REPORT_TYPES = [
  { id: "business-resilience", label: "Business Resilience Report" },
  { id: "dora-assessment", label: "DORA Assessment Report" },
  { id: "cloud-gap", label: "Cloud Resilience Gap Report" },
  { id: "remediation", label: "Remediation Report" },
  { id: "recovery-testing", label: "Recovery Testing Report" },
];

export function ReportsPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function runReport(type: string) {
    setLoading(true);
    try {
      const data = await apiRequest<Record<string, unknown>>(`/api/v1/resilience/reports/${type}`);
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="JSON summaries distinguishing observed evidence, assessments, and recommendations."
      />
      <ul className="flex flex-wrap gap-2">
        {REPORT_TYPES.map((r) => (
          <li key={r.id}>
            <Button disabled={loading} onClick={() => runReport(r.id)}>
              {r.label}
            </Button>
          </li>
        ))}
      </ul>
      {result && (
        <pre className="mt-6 max-h-96 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
          {result}
        </pre>
      )}
    </div>
  );
}
