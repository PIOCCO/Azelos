import { FormEvent, useState } from "react";
import { createBusinessFunction } from "../../api/dora";
import type { BusinessFunction } from "../../api/types";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { can, isReadOnlyAuditor } from "../../lib/permissions";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";

export function BusinessFunctionsPage() {
  const { session } = useAuth();
  const { data, page, setPage, isLoading, refetch, error } = usePaginatedResource<BusinessFunction>(
    "business-functions",
    "/api/v1/business-functions",
  );
  const canWrite = can(session?.role, "org.admin") && !isReadOnlyAuditor(session?.role);
  const [formOpen, setFormOpen] = useState(false);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createBusinessFunction({
      name: String(fd.get("name")),
      function_identifier: String(fd.get("function_identifier")),
      critical_or_important: String(fd.get("critical_or_important")),
    });
    setFormOpen(false);
    refetch();
  }

  return (
    <ModuleGate item={{ label: "Business Functions", moduleKey: "ASSET_MANAGEMENT" }}>
      <PageHeader
        title="Business Functions"
        subtitle="Function critical or important — distinct from ICT asset inherent criticality."
        actions={
          canWrite ? (
            <Button onClick={() => setFormOpen(!formOpen)}>{formOpen ? "Cancel" : "New function"}</Button>
          ) : null
        }
      />
      {formOpen ? (
        <form
          onSubmit={onCreate}
          className="mb-6 grid max-w-2xl gap-3 rounded-lg border bg-surface p-5 shadow-card md:grid-cols-2"
        >
          <input name="name" placeholder="Name" required className="rounded-lg border px-3 py-2 text-sm" />
          <input
            name="function_identifier"
            placeholder="Identifier"
            required
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select name="critical_or_important" className="rounded-lg border px-3 py-2 text-sm md:col-span-2">
            <option value="critical">Critical</option>
            <option value="important">Important</option>
            <option value="neither">Neither</option>
          </select>
          <Button type="submit" className="w-fit">
            Create
          </Button>
        </form>
      ) : null}
      <DataTable
        title="Functions"
        columns={[
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "id", header: "Identifier", render: (r) => r.function_identifier },
          {
            key: "crit",
            header: "Critical / important",
            render: (r) => (
              <StatusBadge tone={toneFromLevel(r.critical_or_important)}>{r.critical_or_important}</StatusBadge>
            ),
          },
          { key: "status", header: "Status", render: (r) => r.status },
        ]}
        data={data}
        page={page}
        onPageChange={setPage}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
      />
    </ModuleGate>
  );
}
