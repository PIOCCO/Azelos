import { FormEvent, useState } from "react";
import { createAssetFunctionMap, createICTAsset } from "../../api/dora";
import type { BusinessFunction, ICTAsset } from "../../api/types";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { StatusBadge, toneFromLevel } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
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
    <ModuleGate item={{ label: "ICT Assets", moduleKey: "ASSET_MANAGEMENT" }}>
      <PageHeader
        title="ICT Asset Inventory"
        subtitle="Inherent asset criticality is separate from business function criticality and mapping flags."
        actions={
          canWrite ? (
            <Button onClick={() => setMapOpen(!mapOpen)} variant="secondary">
              Map to business function
            </Button>
          ) : null
        }
      />
      {canWrite ? (
        <form
          onSubmit={onCreateAsset}
          className="mb-6 grid max-w-3xl gap-3 rounded-lg border border-gray-200 bg-surface p-5 shadow-card md:grid-cols-4"
        >
          <input name="name" placeholder="Asset name" required className="rounded-lg border px-3 py-2 text-sm" />
          <input
            name="asset_identifier"
            placeholder="Identifier"
            required
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select name="inherent_criticality" className="rounded-lg border px-3 py-2 text-sm">
            <option value="critical">Critical</option>
            <option value="important">Important</option>
            <option value="neither">Neither</option>
          </select>
          <Button type="submit">Add asset</Button>
        </form>
      ) : null}
      {mapOpen && canWrite ? (
        <form onSubmit={onMap} className="mb-6 grid max-w-3xl gap-3 rounded-lg border bg-surface p-5 shadow-card md:grid-cols-3">
          <select name="ict_asset_id" required className="rounded-lg border px-3 py-2 text-sm">
            <option value="">ICT asset</option>
            {list.data?.items.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select name="function_id" required className="rounded-lg border px-3 py-2 text-sm">
            <option value="">Business function</option>
            {functions.data?.items.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="supports_critical_function" />
            Supports critical function
          </label>
          <Button type="submit" className="md:col-span-3 w-fit">
            Create mapping
          </Button>
        </form>
      ) : null}
      <DataTable
        title="Assets"
        columns={[
          { key: "name", header: "Asset name", render: (r) => r.name },
          { key: "id", header: "Identifier", render: (r) => r.asset_identifier },
          {
            key: "inh",
            header: "Inherent criticality",
            render: (r) => (
              <StatusBadge tone={toneFromLevel(r.inherent_criticality)}>{r.inherent_criticality}</StatusBadge>
            ),
          },
        ]}
        data={list.data}
        page={list.page}
        onPageChange={list.setPage}
        isLoading={list.isLoading}
        error={list.error as Error | null}
        onRetry={() => list.refetch()}
        emptyTitle="No ICT assets yet"
        emptyDescription="Start by adding your first ICT asset."
      />
    </ModuleGate>
  );
}
