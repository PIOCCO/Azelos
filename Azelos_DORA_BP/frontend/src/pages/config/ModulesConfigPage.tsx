import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listConfigModules, setConfigModule } from "../../api/dora";
import { useAuth } from "../../contexts/AuthContext";
import { useOrg } from "../../contexts/OrgContext";
import { can } from "../../lib/permissions";
import { ErrorPanel, LoadingPanel } from "../../components/ui/StatePanel";
import { Navigate } from "react-router-dom";

export function ModulesConfigPage() {
  const { session } = useAuth();
  const { refreshOrg } = useOrg();
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

  if (!can(session?.role, "org.admin")) {
    return <Navigate to="/" replace />;
  }
  if (q.isLoading) return <LoadingPanel />;
  if (q.error) return <ErrorPanel message={(q.error as Error).message} />;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Module configuration</h1>
      <p className="mt-1 text-sm text-slate-600">
        Toggles call the backend; applicability refreshes after changes.
      </p>
      <ul className="mt-6 space-y-2">
        {(q.data ?? []).map((m) => (
          <li
            key={m.key}
            className="flex items-center justify-between rounded border bg-white px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-slate-500">{m.description}</p>
            </div>
            <button
              type="button"
              disabled={mut.isPending}
              className={`rounded px-3 py-1 ${m.enabled ? "bg-slate-800 text-white" : "border"}`}
              onClick={() => mut.mutate({ key: m.key, enabled: !m.enabled })}
            >
              {m.enabled ? "Enabled" : "Disabled"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
