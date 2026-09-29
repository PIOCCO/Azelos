import { FormEvent, useState } from "react";
import { createAssetFunctionMap, createICTAsset } from "../../api/dora";
import type { BusinessFunction, ICTAsset } from "../../api/types";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { PaginatedTable } from "../../components/ui/PaginatedTable";
import { useAuth } from "../../contexts/AuthContext";
import { can, isReadOnlyAuditor } from "../../lib/permissions";
import { usePaginatedResource } from "../../hooks/usePaginatedResource";
import { fetchPaginated } from "../../api/dora";
import { useQuery } from "@tanstack/react-query";

export function ICTAssetsPage() {
  const { session } = useAuth();
  const list = usePaginatedResource<ICTAsset>("ict-assets", "/api/v1/ict-assets");
  const functions = useQuery({
    queryKey: ["bf-pick"],
    queryFn: () => fetchPaginated<BusinessFunction>("/api/v1/business-functions", 1, 100),
  });
  const canWrite = can(session?.role, "security.write") && !isReadOnlyAuditor(session?.role);
  const [mapOpen, setMapOpen] = useState(false);

  async function onCreateAsset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createICTAsset({
      name: String(fd.get("name")),
      asset_identifier: String(fd.get("asset_identifier")),
      inherent_criticality: String(fd.get("inherent_criticality")),
    });
    list.refetch();
    e.currentTarget.reset();
  }

  async function onMap(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createAssetFunctionMap({
      function_id: String(fd.get("function_id")),
      ict_asset_id: String(fd.get("ict_asset_id")),
      supports_critical_function: fd.get("supports_critical_function") === "on",
    });
    setMapOpen(false);
  }

  return (
    <ModuleGate item={{ label: "ICT assets", moduleKey: "ASSET_MANAGEMENT" }}>
      <h1 className="text-2xl font-semibold">ICT assets</h1>
      <p className="mt-1 text-sm text-slate-600">
        <strong>Inherent criticality</strong> on the asset is separate from business function
        criticality and from <strong>supports critical function</strong> on the mapping.
      </p>
      {canWrite ? (
        <>
          <form onSubmit={onCreateAsset} className="mt-4 grid max-w-md gap-2 rounded border bg-white p-4">
            <input name="name" placeholder="Name" required className="rounded border px-2 py-1" />
            <input
              name="asset_identifier"
              placeholder="Identifier"
              required
              className="rounded border px-2 py-1"
            />
            <select name="inherent_criticality" className="rounded border px-2 py-1">
              <option value="critical">critical</option>
              <option value="important">important</option>
              <option value="neither">neither</option>
            </select>
            <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">
              Create ICT asset
            </button>
          </form>
          <button
            type="button"
            className="mt-2 text-sm underline"
            onClick={() => setMapOpen(!mapOpen)}
          >
            Map asset to business function
          </button>
          {mapOpen ? (
            <form onSubmit={onMap} className="mt-2 grid max-w-md gap-2 rounded border bg-white p-4">
              <select name="ict_asset_id" required className="rounded border px-2 py-1">
                <option value="">ICT asset</option>
                {list.data?.items.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <select name="function_id" required className="rounded border px-2 py-1">
                <option value="">Business function</option>
                {functions.data?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.critical_or_important})
                  </option>
                ))}
              </select>
              <label className="flex gap-2 text-sm">
                <input type="checkbox" name="supports_critical_function" />
                Supports critical function (relationship flag)
              </label>
              <button type="submit" className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white">
                Create mapping
              </button>
            </form>
          ) : null}
        </>
      ) : null}
      <div className="mt-4">
        <PaginatedTable
          data={list.data}
          page={list.page}
          onPageChange={list.setPage}
          isLoading={list.isLoading}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "id", header: "Identifier", render: (r) => r.asset_identifier },
            {
              key: "inh",
              header: "Inherent criticality",
              render: (r) => r.inherent_criticality,
            },
          ]}
        />
      </div>
    </ModuleGate>
  );
}
