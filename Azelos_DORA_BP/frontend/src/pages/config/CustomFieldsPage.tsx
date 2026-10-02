import { FormEvent, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomField, listCustomFields } from "../../api/dora";
import type { CustomField } from "../../api/types";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { ErrorPanel, LoadingPanel } from "../../components/ui/StatePanel";
import { Navigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";

const ENTITY_TYPES = [
  { value: "financial_entity", label: "Organization" },
  { value: "ict_provider", label: "ICT provider" },
  { value: "contract", label: "Contract" },
  { value: "ict_service", label: "ICT service" },
  { value: "business_function", label: "Business function" },
  { value: "evidence", label: "Evidence" },
  { value: "risk_assessment", label: "Risk assessment" },
  { value: "exit_strategy", label: "Exit strategy" },
] as const;

const FIELD_TYPES = [
  "TEXT",
  "LONG_TEXT",
  "INTEGER",
  "DECIMAL",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "SELECT",
  "MULTI_SELECT",
  "URL",
  "EMAIL",
  "REFERENCE",
] as const;

function entityLabel(entityType: string) {
  return ENTITY_TYPES.find((e) => e.value === entityType)?.label ?? entityType;
}

export function CustomFieldsPage({ embedded = false }: { embedded?: boolean }) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["custom-fields"], queryFn: () => listCustomFields() });
  const createMut = useMutation({
    mutationFn: createCustomField,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-fields"] }),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, CustomField[]>();
    for (const row of q.data ?? []) {
      const list = map.get(row.entity_type) ?? [];
      list.push(row);
      map.set(row.entity_type, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [q.data]);

  if (!embedded && !can(session?.role, "org.admin")) {
    return <Navigate to="/" replace />;
  }
  if (q.isLoading) return <LoadingPanel />;
  if (q.error) return <ErrorPanel message={(q.error as Error).message} />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createMut.mutateAsync({
      entity_type: String(fd.get("entity_type")),
      field_key: String(fd.get("field_key")),
      display_name: String(fd.get("display_name")),
      field_type: String(fd.get("field_type")),
      required: fd.get("required") === "on",
    });
    e.currentTarget.reset();
  }

  return (
    <div className="max-w-3xl space-y-6">
      {embedded ? (
        <p className="text-sm text-gray-600">
          Extend supported DORA registers with tenant-specific attributes. Values are validated server-side per entity
          type.
        </p>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Custom fields</h1>
          <p className="mt-1 text-sm text-slate-600">
            Platform configuration for additional attributes on allowlisted entity types.
          </p>
        </>
      )}

      <Card title="Add field definition">
        <form onSubmit={onSubmit} className="grid gap-3 text-sm">
          <label className="block">
            Entity register
            <select name="entity_type" required className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5">
              {ENTITY_TYPES.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Field key
            <input
              name="field_key"
              required
              pattern="[a-z][a-z0-9_]{0,63}"
              title="Lowercase snake_case"
              placeholder="internal_reference"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
            />
          </label>
          <label className="block">
            Display name
            <input name="display_name" required className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" />
          </label>
          <label className="block">
            Field type
            <select name="field_type" className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5">
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="required" /> Required on forms
          </label>
          <button type="submit" className="w-fit rounded bg-slate-900 px-3 py-1.5 text-white" disabled={createMut.isPending}>
            Create field
          </button>
          {createMut.error ? (
            <p className="text-sm text-red-600">{(createMut.error as Error).message}</p>
          ) : null}
        </form>
      </Card>

      {grouped.length === 0 ? (
        <Card title="Defined fields">
          <p className="text-sm text-slate-500">
            No custom fields yet. Add definitions above to capture organization-specific data on ICT providers,
            contracts, risks, and other supported registers.
          </p>
        </Card>
      ) : (
        grouped.map(([entityType, fields]) => (
          <Card key={entityType} title={entityLabel(entityType)}>
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1 font-medium">Display name</th>
                  <th className="font-medium">Key</th>
                  <th className="font-medium">Type</th>
                  <th className="font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {fields!.map((f) => (
                  <tr key={f.id} className="border-t border-gray-100">
                    <td className="py-2">{f.display_name}</td>
                    <td className="font-mono text-xs">{f.field_key}</td>
                    <td>{f.field_type}</td>
                    <td>{f.active ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))
      )}
    </div>
  );
}
