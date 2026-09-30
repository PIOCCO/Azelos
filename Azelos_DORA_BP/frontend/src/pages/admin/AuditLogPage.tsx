import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPaginated } from "../../api/dora";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { Navigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { LoadingSkeleton, ErrorState } from "../../components/ui/States";

interface AuditRow {
  id: string;
  actor: string;
  entity_type: string;
  entity_id: string;
  action: string;
  created_at: string;
  notes?: string | null;
}

export function AuditLogPage() {
  const { session } = useAuth();
  const [page, setPage] = useState(1);
  if (!can(session?.role, "auditor.readonly")) {
    return <Navigate to="/" replace />;
  }

  const q = useQuery({
    queryKey: ["audit-records", page],
    queryFn: () => fetchPaginated<AuditRow>("/api/v1/audit-records", page, 30),
    enabled: !!session?.token,
  });

  if (q.isLoading) return <LoadingSkeleton rows={8} />;
  if (q.error) return <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />;

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Immutable platform audit trail for your organization (auditor access)."
      />
      <DataTable
        columns={[
          { key: "at", header: "When", render: (r) => new Date(r.created_at).toLocaleString() },
          { key: "actor", header: "Actor", render: (r) => r.actor },
          { key: "action", header: "Action", render: (r) => r.action },
          { key: "entity", header: "Entity", render: (r) => `${r.entity_type} · ${r.entity_id.slice(0, 8)}…` },
          { key: "notes", header: "Notes", render: (r) => r.notes ?? "—" },
        ]}
        data={q.data}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
