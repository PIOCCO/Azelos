import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EvidenceAttachmentFile, EvidenceEntityType } from "../../api/types";
import { listEvidenceAttachments, uploadEvidenceAttachment } from "../../api/dora";
import { Button } from "../ui/Button";
import { downloadEvidenceFile, viewEvidenceFile } from "../../lib/evidenceFile";

export function EvidenceAttachmentsPanel(props: {
  entityType: EvidenceEntityType;
  entityId: string;
  /** When provided (e.g. list API), skip initial fetch. */
  initialFiles?: EvidenceAttachmentFile[];
  invalidateQueryKeys?: string[][];
}) {
  const { entityType, entityId, initialFiles, invalidateQueryKeys = [] } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["evidence-attachments", entityType, entityId],
    queryFn: () => listEvidenceAttachments(entityType, entityId),
    enabled: initialFiles === undefined,
    initialData: initialFiles,
  });

  const files = listQ.data ?? [];

  const uploadM = useMutation({
    mutationFn: (file: File) => uploadEvidenceAttachment(entityType, entityId, file),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["evidence-attachments", entityType, entityId] });
      for (const key of invalidateQueryKeys) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
    onError: (e: Error) => setError(e.message),
  });

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      return;
    }
    uploadM.mutate(file);
  }

  return (
    <div className="space-y-1 text-sm">
      {files.length === 0 ? (
        <p className="text-gray-500">No evidence</p>
      ) : (
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f.evidence_id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-800">{f.file_name}</span>
              <Button
                type="button"
                variant="secondary"
                className="px-2 py-0.5 text-xs"
                onClick={() => viewEvidenceFile(f.evidence_id).catch((e) => setError(String(e)))}
              >
                View
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="px-2 py-0.5 text-xs"
                onClick={() =>
                  downloadEvidenceFile(f.evidence_id, f.file_name).catch((e) => setError(String(e)))
                }
              >
                Download
              </Button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          onPickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="primary"
        className="px-2 py-0.5 text-xs"
        disabled={uploadM.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {uploadM.isPending ? "Uploading…" : "Import"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
