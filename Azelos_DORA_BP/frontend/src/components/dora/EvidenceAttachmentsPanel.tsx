import { useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileText, Plus, Trash2 } from "lucide-react";
import type { EvidenceAttachmentFile, EvidenceEntityType } from "../../api/types";
import {
  deleteEvidenceAttachment,
  listEvidenceAttachments,
  uploadEvidenceAttachment,
} from "../../api/dora";
import { Button } from "../ui/Button";
import { downloadEvidenceFile, viewEvidenceFile } from "../../lib/evidenceFile";

export type EvidenceAttachmentsVariant = "table" | "panel";

/** Shared evidence Import / View / Download UI for DORA entity tables and detail cards. */
export function EvidenceAttachmentsPanel(props: {
  entityType: EvidenceEntityType;
  entityId: string;
  /** When provided (e.g. list API), skip initial fetch. */
  initialFiles?: EvidenceAttachmentFile[];
  invalidateQueryKeys?: string[][];
  variant?: EvidenceAttachmentsVariant;
}) {
  const {
    entityType,
    entityId,
    initialFiles,
    invalidateQueryKeys = [],
    variant = "table",
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const useListFromApi = initialFiles === undefined;

  const listQ = useQuery({
    queryKey: ["evidence-attachments", entityType, entityId],
    queryFn: () => listEvidenceAttachments(entityType, entityId),
    enabled: useListFromApi,
  });

  /** When list APIs embed evidence_files, always render from props (React Query initialData does not track prop updates). */
  const files = useListFromApi ? (listQ.data ?? []) : (initialFiles ?? []);

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

  const deleteM = useMutation({
    mutationFn: (evidenceId: string) =>
      deleteEvidenceAttachment(entityType, entityId, evidenceId),
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

  function openImport() {
    inputRef.current?.click();
  }

  async function onView(f: EvidenceAttachmentFile) {
    setBusyId(f.evidence_id);
    try {
      await viewEvidenceFile(f.evidence_id);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  }

  function onDelete(f: EvidenceAttachmentFile) {
    if (deleteM.isPending) return;
    if (!window.confirm(`Remove "${f.file_name}"?`)) return;
    deleteM.mutate(f.evidence_id);
  }

  async function onDownload(f: EvidenceAttachmentFile) {
    setBusyId(f.evidence_id);
    try {
      await downloadEvidenceFile(f.evidence_id, f.file_name);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  }

  const hiddenInput = (
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
  );

  if (listQ.isLoading && useListFromApi) {
    return <p className="text-sm text-gray-400">Loading evidence…</p>;
  }

  if (listQ.isError) {
    return (
      <p className="text-xs text-red-600">
        {(listQ.error as Error).message}
      </p>
    );
  }

  if (variant === "panel") {
    return (
      <div className="space-y-3 text-sm">
        {files.length === 0 ? (
          <p className="text-gray-500">No evidence</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.evidence_id}
                className="group flex flex-wrap items-center gap-2 rounded-md border border-gray-100 bg-gray-50/60 px-3 py-2"
              >
                <PdfFileRow
                  name={f.file_name}
                  onDelete={() => onDelete(f)}
                  deleteDisabled={deleteM.isPending || busyId === f.evidence_id}
                  deleting={deleteM.isPending && deleteM.variables === f.evidence_id}
                />
                <ActionButtons
                  file={f}
                  busy={busyId === f.evidence_id}
                  onView={() => onView(f)}
                  onDownload={() => onDownload(f)}
                  includeImport={false}
                  onImport={openImport}
                  importPending={uploadM.isPending}
                />
              </li>
            ))}
          </ul>
        )}
        {hiddenInput}
        <ImportButton
          primary={files.length === 0}
          label={files.length === 0 ? "Import PDF" : "Import"}
          pending={uploadM.isPending}
          onClick={openImport}
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="min-w-[260px] max-w-xl text-sm">
      {files.length === 0 ? (
        <EvidenceTableRow
          evidence={<span className="text-gray-400">No evidence</span>}
          actions={
            <>
              {hiddenInput}
              <ImportButton
                primary
                label="Import PDF"
                pending={uploadM.isPending}
                onClick={openImport}
              />
            </>
          }
        />
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <EvidenceTableRow
              key={f.evidence_id}
              evidence={
                <PdfFileRow
                  name={f.file_name}
                  boxed
                  onDelete={() => onDelete(f)}
                  deleteDisabled={deleteM.isPending || busyId === f.evidence_id}
                  deleting={deleteM.isPending && deleteM.variables === f.evidence_id}
                />
              }
              actions={
                <ActionButtons
                  file={f}
                  busy={busyId === f.evidence_id}
                  onView={() => onView(f)}
                  onDownload={() => onDownload(f)}
                  includeImport
                  onImport={openImport}
                  importPending={uploadM.isPending}
                />
              }
            />
          ))}
          {hiddenInput}
        </div>
      )}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

/** Alias for documentation / imports preferring the EvidenceFiles name. */
export const EvidenceFiles = EvidenceAttachmentsPanel;

/** Column sub-header matching list tables (Evidence | Actions). */
export function EvidencePdfColumnSubHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 font-normal normal-case tracking-normal text-[10px] text-gray-400">
      <span>Evidence</span>
      <span>Actions</span>
    </div>
  );
}

function EvidenceTableRow({
  evidence,
  actions,
}: {
  evidence: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
      {evidence !== null ? (
        <div className="min-w-0">{evidence}</div>
      ) : (
        <div className="hidden min-w-0 sm:block" aria-hidden />
      )}
      <div className="flex flex-wrap items-center justify-start gap-1 sm:justify-end">{actions}</div>
    </div>
  );
}

function PdfFileRow({
  name,
  boxed,
  onDelete,
  deleteDisabled,
  deleting,
}: {
  name: string;
  boxed?: boolean;
  onDelete: () => void;
  deleteDisabled?: boolean;
  deleting?: boolean;
}) {
  const inner = (
    <>
      <span className="inline-flex shrink-0 items-center justify-center rounded border border-red-200 bg-white px-1 py-0.5 text-[10px] font-bold leading-none text-red-700">
        PDF
      </span>
      <FileText className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium text-gray-800" title={name}>
        {name}
      </span>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleteDisabled}
        title="Remove PDF"
        aria-label={`Remove ${name}`}
        className="ml-1 inline-flex shrink-0 items-center justify-center rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-30 group-hover:opacity-100"
      >
        <Trash2 className={`h-4 w-4 ${deleting ? "animate-pulse" : ""}`} aria-hidden />
      </button>
    </>
  );
  if (boxed) {
    return (
      <div className="group flex min-w-0 items-center gap-2 rounded-md border border-gray-200 bg-gray-50/80 px-2 py-1.5">
        {inner}
      </div>
    );
  }
  return <div className="group flex min-w-0 flex-1 items-center gap-2">{inner}</div>;
}

function ActionButtons({
  busy,
  onView,
  onDownload,
  includeImport,
  onImport,
  importPending,
}: {
  file: EvidenceAttachmentFile;
  busy?: boolean;
  onView: () => void;
  onDownload: () => void;
  includeImport: boolean;
  onImport: () => void;
  importPending: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <OutlineAction icon={<Eye className="h-3.5 w-3.5" />} label="View" disabled={busy} onClick={onView} />
      <OutlineAction
        icon={<Download className="h-3.5 w-3.5" />}
        label="Download"
        disabled={busy}
        onClick={onDownload}
      />
      {includeImport ? (
        <ImportButton
          label="Import"
          pending={importPending}
          onClick={onImport}
          compact
        />
      ) : null}
    </div>
  );
}

function OutlineAction({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ImportButton({
  label,
  onClick,
  pending,
  primary,
  compact,
}: {
  label: string;
  onClick: () => void;
  pending?: boolean;
  primary?: boolean;
  compact?: boolean;
}) {
  /** Icon carries the plus; strip accidental "+" prefixes from labels. */
  const text = pending ? "Uploading…" : label.replace(/^\+\s*/, "");
  const icon = <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  if (primary) {
    return (
      <Button
        type="button"
        variant="primary"
        className={`gap-1.5 ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"}`}
        disabled={pending}
        onClick={onClick}
      >
        {icon}
        {text}
      </Button>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 ${
        compact ? "px-2 py-1 text-xs" : "px-2.5 py-1 text-xs"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}
