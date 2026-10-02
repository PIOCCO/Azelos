import { useState } from "react";
import { apiRequest } from "../../api/client";
import { downloadDoraAssessmentPdf } from "../../api/dora";
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-surface p-3">
        <Button
          type="button"
          variant="primary"
          disabled={pdfLoading}
          onClick={() => {
            setPdfError(null);
            setPdfLoading(true);
            downloadDoraAssessmentPdf()
              .catch((e) => setPdfError(String(e)))
              .finally(() => setPdfLoading(false));
          }}
        >
          {pdfLoading ? "Generating…" : "Export DORA assessment (PDF)"}
        </Button>
        {pdfError ? <p className="text-sm text-red-600">{pdfError}</p> : null}
      </div>
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
