import { useOrg } from "../contexts/OrgContext";
import { LoadingPanel, EmptyPanel } from "../components/ui/StatePanel";

export function ApplicabilityPage() {
  const { applicability, isLoading } = useOrg();
  if (isLoading) return <LoadingPanel />;
  if (!applicability) return <EmptyPanel message="No applicability data." />;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Applicability</h1>
      <p className="mt-1 text-sm text-slate-600">Read-only result from the rules engine.</p>

      <section className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Feature flags</h2>
        <ul className="mt-2 text-sm">
          {Object.entries(applicability.features).map(([k, v]) => (
            <li key={k}>
              {k}: {v ? "yes" : "no"}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Modules</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500">
              <th className="py-1">Module</th>
              <th>Enabled</th>
              <th>Applicable</th>
              <th>Required</th>
            </tr>
          </thead>
          <tbody>
            {applicability.modules.map((m) => (
              <tr key={m.key} className="border-t">
                <td className="py-2">{m.name}</td>
                <td>{m.enabled ? "yes" : "no"}</td>
                <td>{m.applicable ? "yes" : "no"}</td>
                <td>{m.required ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
