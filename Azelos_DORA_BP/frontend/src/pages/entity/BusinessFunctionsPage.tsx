import { FormEvent, useState } from "react";
import { createBusinessFunction } from "../../api/dora";
import type { BusinessFunction } from "../../api/types";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { PaginatedTable } from "../../components/ui/PaginatedTable";
import { useAuth } from "../../contexts/AuthContext";
import { can, isReadOnlyAuditor } from "../../lib/permissions";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";

export function BusinessFunctionsPage() {
  const { session } = useAuth();
  const { data, page, setPage, isLoading, refetch } = usePaginatedResource<BusinessFunction>(
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
    <ModuleGate item={{ label: "Business functions", moduleKey: "ASSET_MANAGEMENT" }}>
      <h1 className="text-2xl font-semibold">Business functions</h1>
      <p className="mt-1 text-sm text-slate-600">
        Criticality here is{" "}
        <strong>business function critical or important</strong> (distinct from ICT asset inherent
        criticality).
      </p>
      {canWrite ? (
        <button
          type="button"
          className="mt-4 rounded border px-3 py-1.5 text-sm"
          onClick={() => setFormOpen(!formOpen)}
        >
          {formOpen ? "Cancel" : "New function"}
        </button>
      ) : null}
      {formOpen ? (
        <form onSubmit={onCreate} className="mt-4 grid max-w-md gap-2 rounded border bg-white p-4">
          <input name="name" placeholder="Name" required className="rounded border px-2 py-1" />
          <input
            name="function_identifier"
            placeholder="Identifier"
            required
            className="rounded border px-2 py-1"
          />
          <select name="critical_or_important" className="rounded border px-2 py-1">
            <option value="critical">critical</option>
            <option value="important">important</option>
            <option value="neither">neither</option>
          </select>
          <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
            Create
          </button>
        </form>
      ) : null}
      <div className="mt-4">
        <PaginatedTable
          data={data}
          page={page}
          onPageChange={setPage}
          isLoading={isLoading}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "id", header: "Identifier", render: (r) => r.function_identifier },
            {
              key: "crit",
              header: "Critical / important",
              render: (r) => r.critical_or_important,
            },
            { key: "status", header: "Status", render: (r) => r.status },
          ]}
        />
      </div>
    </ModuleGate>
  );
}
