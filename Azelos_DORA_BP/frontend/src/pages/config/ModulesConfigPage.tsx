import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listConfigModules, setConfigModule } from "../../api/dora";
import { useAuth } from "../../contexts/AuthContext";
import { useOrg } from "../../contexts/OrgContext";
import { can } from "../../lib/permissions";
import { ErrorPanel, LoadingPanel } from "../../components/ui/StatePanel";
import { Navigate } from "react-router-dom";

export function ModulesConfigPage({ embedded = false }: { embedded?: boolean }) {
  const { session } = useAuth();
  const { refreshOrg, applicability } = useOrg();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["config-modules"], queryFn: listConfigModules });
  const mut = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      setConfigModule(key, enabled),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["config-modules"] });
      await refreshOrg();
    },
  });

  if (!embedded && !can(session?.role, "org.admin")) {
    return <Navigate to="/" replace />;
  }
  if (q.isLoading) return <LoadingPanel />;
  if (q.error) return <ErrorPanel message={(q.error as Error).message} />;

  return (
    <div>
      {embedded ? (
        <>
          <h2 className="text-lg font-semibold text-gray-900">Platform modules</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enable or disable DORA capability areas for this tenant. Changes persist immediately and refresh
            navigation applicability.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Module configuration</h1>
          <p className="mt-1 text-sm text-slate-600">
            Toggles call the backend; applicability refreshes after changes.
          </p>
        </>
      )}
      <ul className="mt-6 space-y-2">
        {(q.data ?? []).map((m) => {
          const appl = applicability?.modules.find((x) => x.key === m.key);
          const locked = appl?.final_status === "required" || appl?.admin_can_disable === false;
          return (
          <li
            key={m.key}
            className="flex items-center justify-between rounded border bg-white px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-slate-500">{m.description}</p>
              {locked ? (
                <p className="mt-1 text-xs text-amber-800">Required by applicability rules</p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={mut.isPending || (locked && m.enabled)}
              className={`rounded px-3 py-1 ${m.enabled ? "bg-slate-800 text-white" : "border"}`}
              onClick={() => mut.mutate({ key: m.key, enabled: !m.enabled })}
            >
              {locked && m.enabled ? "Required" : m.enabled ? "Enabled" : "Disabled"}
            </button>
          </li>
        );
        })}
      </ul>
    </div>
  );
}
