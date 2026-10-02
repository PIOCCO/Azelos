import { getApiBase, getTokenProvider } from "../api/client";

async function fetchEvidenceBlob(evidenceId: string, mode: "download" | "view"): Promise<Blob> {
  const token = getTokenProvider()();
  const path =
    mode === "view"
      ? `/api/v1/evidence/${evidenceId}/view`
      : `/api/v1/evidence/${evidenceId}/download`;
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Evidence request failed");
  }
  return res.blob();
}

export async function downloadEvidenceFile(evidenceId: string, fileName: string): Promise<void> {
  const blob = await fetchEvidenceBlob(evidenceId, "download");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function viewEvidenceFile(evidenceId: string): Promise<void> {
  const blob = await fetchEvidenceBlob(evidenceId, "view");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
