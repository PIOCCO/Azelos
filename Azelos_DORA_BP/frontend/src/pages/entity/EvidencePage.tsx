import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPaginated, listDocumentTypes, uploadEvidenceFile } from "../../api/dora";
import type { Evidence } from "../../api/types";
import { downloadEvidenceFile, viewEvidenceFile } from "../../lib/evidenceFile";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { useEffect, useState } from "react";

export function EvidencePage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [docTypeId, setDocTypeId] = useState("");
  const docTypesQ = useQuery({
    queryKey: ["document-types"],
    queryFn: listDocumentTypes,
  });
  const listQ = useQuery({
    queryKey: ["evidence", page],
    queryFn: () => fetchPaginated<Evidence>("/api/v1/evidence", page),
  });
  const uploadM = useMutation({
    mutationFn: (file: File) => {
      if (!docTypeId) throw new Error("Select a document type");
      return uploadEvidenceFile(file, docTypeId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evidence"] }),
  });

  useEffect(() => {
    if (docTypesQ.data?.length && !docTypeId) {
      setDocTypeId(docTypesQ.data[0]!.id);
    }
  }, [docTypesQ.data, docTypeId]);

  if (listQ.isLoading || docTypesQ.isLoading) return <LoadingSkeleton rows={6} />;
  if (listQ.error) return <ErrorState message={(listQ.error as Error).message} onRetry={() => listQ.refetch()} />;
  if (docTypesQ.error) {
    return <ErrorState message={(docTypesQ.error as Error).message} onRetry={() => docTypesQ.refetch()} />;
  }

  const data = listQ.data!;
  const docTypes = docTypesQ.data ?? [];

  return (
    <div>
      <PageHeader title="Evidence" subtitle="Upload files linked to your organization (metadata + storage)." />
      {docTypes.length === 0 ? (
        <p className="mb-4 text-sm text-amber-800">
          No document types in the database. Run database migrations and reference seed data.
        </p>
      ) : (
        <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border bg-surface p-3">
          <label className="text-sm">
            Document type
            <select
              className="ml-2 rounded border px-2 py-1 text-sm"
              value={docTypeId}
              onChange={(e) => setDocTypeId(e.target.value)}
            >
              {docTypes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} ({d.code})
                </option>
              ))}
            </select>
          </label>
          <label className="cursor-pointer">
            <span className="sr-only">Upload evidence</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadM.mutate(f);
              }}
            />
            <Button type="button" variant="primary" disabled={uploadM.isPending || !docTypeId}>
              {uploadM.isPending ? "Uploading…" : "Upload file"}
            </Button>
          </label>
          {uploadM.error ? <p className="text-sm text-red-600">{(uploadM.error as Error).message}</p> : null}
          {uploadM.isSuccess ? <p className="text-sm text-green-700">Upload complete.</p> : null}
        </div>
      )}
      <DataTable<Evidence>
        columns={[
          {
            key: "file_name",
            header: "File",
            render: (r) => <span className="font-medium text-gray-800">{r.file_name}</span>,
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-2 py-0.5 text-xs"
                  onClick={() => viewEvidenceFile(r.id).catch(() => undefined)}
                >
                  View
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-2 py-0.5 text-xs"
                  onClick={() => downloadEvidenceFile(r.id, r.file_name).catch(() => undefined)}
                >
                  Download
                </Button>
              </div>
            ),
          },
          { key: "storage", header: "Storage", render: (r) => r.storage_provider },
          {
            key: "uploaded_at",
            header: "Uploaded",
            render: (r) => new Date(r.uploaded_at).toLocaleString(),
          },
        ]}
        data={data}
        page={page}
        onPageChange={setPage}
        emptyTitle="No evidence yet"
        emptyDescription="Upload a policy or audit artifact using the form above."
      />
    </div>
  );
}
