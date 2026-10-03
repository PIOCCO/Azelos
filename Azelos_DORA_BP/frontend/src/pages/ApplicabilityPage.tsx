import { useMutation } from "@tanstack/react-query";
import { patchApplicabilityModule } from "../api/dora";
import type { ModuleApplicability, ModuleRuleResult } from "../api/types";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { can } from "../lib/permissions";
import { LoadingPanel, EmptyPanel, ErrorPanel } from "../components/ui/StatePanel";

function ruleResultLabel(result: ModuleRuleResult): string {
  switch (result) {
    case "required":
      return "Required";
    case "recommended":
      return "Optional";
    default:
      return "Not required";
  }
}

function statusLabel(m: ModuleApplicability): string {
  switch (m.final_status) {
    case "required":
      return "Required";
    case "optional":
      return "Optional";
    default:
      return "Not enabled";
  }
}

function enableReasonText(m: ModuleApplicability): string {
  switch (m.enable_reason) {
    case "required_by_applicability_rules":
      return "Required by applicability rules";
    case "recommended_by_applicability_rules":
      return "Recommended by applicability rules";
    case "enabled_by_organization_administrator":
      return "Enabled by organization administrator";
    default:
      return "Not enabled";
  }
}

export function ApplicabilityPage() {
  const { session } = useAuth();
  const { applicability, organizationId, isLoading, refreshOrg, error } = useOrg();
  const isAdmin = can(session?.role, "org.admin");

  const mut = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      patchApplicabilityModule(organizationId!, key, enabled),
    onSuccess: async () => {
      await refreshOrg();
    },
  });

  if (isLoading) return <LoadingPanel />;
  if (error) return <ErrorPanel message={error.message} />;
  if (!applicability) return <EmptyPanel message="No applicability data." />;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Applicability</h1>
      <p className="mt-1 text-sm text-slate-600">
        Regulatory minimum from the rules engine, plus optional modules your organization chooses to
        implement.
      </p>

      <section className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Rules engine result</h2>
        <p className="mt-1 text-xs text-slate-500">Feature flags derived from your regulatory profile.</p>
        <ul className="mt-2 text-sm">
          {Object.entries(applicability.features).map(([k, v]) => (
            <li key={k}>
              {k}: {v ? "yes" : "no"}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Organization configuration</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enable optional or recommended modules. Required modules cannot be disabled.
        </p>
        {mut.error ? (
          <p className="mt-2 text-sm text-red-700">{(mut.error as Error).message}</p>
        ) : null}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-2 pr-2">Module</th>
                <th className="pr-2">Rules</th>
                <th className="pr-2">Recommended</th>
                <th className="pr-2">Enabled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applicability.modules.map((m) => (
                <tr key={m.key} className="border-t align-top">
                  <td className="py-3 pr-2">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-slate-500">{enableReasonText(m)}</p>
                    {m.matched_rules.length > 0 ? (
                      <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                        {m.matched_rules.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                  <td className="pr-2">{ruleResultLabel(m.rule_result)}</td>
                  <td className="pr-2">{m.recommended ? "Yes" : "—"}</td>
                  <td className="pr-2">
                    {m.final_status === "required" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800">
                        ✓ Enabled <span title="Required by rules">🔒</span>
                      </span>
                    ) : isAdmin ? (
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={m.admin_enabled}
                          disabled={mut.isPending || !m.admin_can_disable}
                          onChange={() => mut.mutate({ key: m.key, enabled: !m.admin_enabled })}
                        />
                        {m.admin_enabled ? "Enabled" : "Disabled"}
                      </label>
                    ) : (
                      <span>{m.enabled ? "Enabled" : "Disabled"}</span>
                    )}
                  </td>
                  <td>{statusLabel(m)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {applicability.rules.length ? (
        <section className="mt-4 rounded-lg border bg-white p-4">
          <h2 className="font-medium">Matched rules</h2>
          <ul className="mt-2 list-inside list-disc text-sm">
            {applicability.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {applicability.requirements_hint.length ? (
        <section className="mt-4 rounded-lg border bg-white p-4">
          <h2 className="font-medium">Requirements hint (informational)</h2>
          <ul className="mt-2 list-inside list-disc text-sm">
            {applicability.requirements_hint.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
