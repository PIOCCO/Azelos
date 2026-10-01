import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPaginated, uploadEvidenceFile } from "../../api/dora";
import type { Evidence } from "../../api/types";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/Button";
import { ErrorState, LoadingSkeleton } from "../../components/ui/States";
import { useState } from "react";

export function EvidencePage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [docTypeId, setDocTypeId] = useState("");
  const listQ = useQuery({
    queryKey: ["evidence", page],
    queryFn: () => fetchPaginated<Evidence>("/api/v1/evidence", page),
  });
  const uploadM = useMutation({
    mutationFn: (file: File) => {
      if (!docTypeId) throw new Error("Enter a document type UUID from seed data");
      return uploadEvidenceFile(file, docTypeId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evidence"] }),
  });

  if (listQ.isLoading) return <LoadingSkeleton rows={6} />;
  if (listQ.error) return <ErrorState message={(listQ.error as Error).message} onRetry={() => listQ.refetch()} />;

  const data = listQ.data!;
  return (
    <div>
      <PageHeader title="Evidence" subtitle="Upload files linked to your organization (metadata + storage)." />
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border bg-surface p-3">
        <label className="text-sm">
          Document type ID
          <input
            className="ml-2 rounded border px-2 py-1 font-mono text-xs"
            value={docTypeId}
            onChange={(e) => setDocTypeId(e.target.value)}
            placeholder="UUID from document_types"
          />
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
          <Button type="button" variant="primary" disabled={uploadM.isPending}>
            {uploadM.isPending ? "Uploading…" : "Upload file"}
          </Button>
        </label>
        {uploadM.error ? <p className="text-sm text-red-600">{(uploadM.error as Error).message}</p> : null}
        {uploadM.isSuccess ? <p className="text-sm text-green-700">Upload complete.</p> : null}
      </div>
      <DataTable<Evidence>
        columns={[
          { key: "file_name", header: "File", render: (r) => r.file_name },
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
