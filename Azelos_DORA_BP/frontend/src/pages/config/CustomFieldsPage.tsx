import { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomField, listCustomFields } from "../../api/dora";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../lib/permissions";
import { ErrorPanel, LoadingPanel } from "../../components/ui/StatePanel";
import { Navigate } from "react-router-dom";

export function CustomFieldsPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["custom-fields"], queryFn: () => listCustomFields() });
  const createMut = useMutation({
    mutationFn: createCustomField,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-fields"] }),
  });

  if (!can(session?.role, "org.admin")) {
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
    <div>
      <h1 className="text-2xl font-semibold">Custom fields</h1>
      <p className="mt-1 text-sm text-slate-600">Definitions from configuration API (dynamic targets).</p>
      <form onSubmit={onSubmit} className="mt-4 grid max-w-lg gap-2 rounded border bg-white p-4 text-sm">
        <input name="entity_type" placeholder="Entity type (e.g. ICT_ASSET)" required className="rounded border px-2 py-1" />
        <input name="field_key" placeholder="field_key" required className="rounded border px-2 py-1" />
        <input name="display_name" placeholder="Display name" required className="rounded border px-2 py-1" />
        <select name="field_type" className="rounded border px-2 py-1">
          {["TEXT", "INTEGER", "BOOLEAN", "DATE", "ENUM"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="flex gap-2">
          <input type="checkbox" name="required" /> Required
        </label>
        <button type="submit" className="rounded bg-slate-900 px-3 py-1.5 text-white">
          Create field
        </button>
      </form>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-1">Entity</th>
            <th>Key</th>
            <th>Type</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((f) => (
            <tr key={f.id} className="border-t">
              <td className="py-2">{f.entity_type}</td>
              <td>{f.display_name}</td>
              <td>{f.field_type}</td>
              <td>{f.active ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
