import { useQuery } from "@tanstack/react-query";
import { listContractControls, listControlDefinitions } from "../../api/dora";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { ErrorPanel, LoadingPanel } from "../../components/ui/StatePanel";

export function ControlsPage() {
  const defs = useQuery({ queryKey: ["control-defs"], queryFn: listControlDefinitions });
  const org = useQuery({ queryKey: ["contract-controls"], queryFn: listContractControls });

  if (defs.isLoading || org.isLoading) return <LoadingPanel />;
  if (defs.error) return <ErrorPanel message={(defs.error as Error).message} />;
  if (org.error) return <ErrorPanel message={(org.error as Error).message} />;

  const defById = new Map((defs.data ?? []).map((d) => [d.id, d]));

  return (
    <ModuleGate item={{ label: "Controls", moduleKey: "ICT_RISK" }}>
      <h1 className="text-2xl font-semibold">Controls</h1>
      <section className="mt-6 rounded border bg-white p-4">
        <h2 className="font-medium">DORA control definitions (read-only)</h2>
        <ul className="mt-2 text-sm">
          {(defs.data ?? []).map((d) => (
            <li key={d.id} className="border-b py-2">
              <span className="font-mono text-xs">{d.code}</span> — {d.title}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded border bg-white p-4">
        <h2 className="font-medium">Contract control implementation</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th>Control</th>
              <th>Compliance</th>
            </tr>
          </thead>
          <tbody>
            {(org.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-slate-500">
                  No contract controls recorded.
                </td>
              </tr>
            ) : (
              (org.data ?? []).map((c) => {
                const d = defById.get(c.control_definition_id);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="py-2">{d ? `${d.code} — ${d.title}` : c.control_definition_id}</td>
                    <td>{c.compliance_status}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </ModuleGate>
  );
}
