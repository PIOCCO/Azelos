import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listContractControls, listControlDefinitions, patchContractControl } from "../../api/dora";
import type { ContractControlRow } from "../../api/types";
import { EvidenceAttachmentsPanel } from "../../components/dora/EvidenceAttachmentsPanel";
import { ModuleGate } from "../../components/auth/ModuleGate";
import { ErrorPanel, LoadingPanel } from "../../components/ui/StatePanel";

export function ControlsPage() {
  const qc = useQueryClient();
  const defs = useQuery({ queryKey: ["control-defs"], queryFn: listControlDefinitions });
  const org = useQuery({ queryKey: ["contract-controls"], queryFn: listContractControls });
  const patchM = useMutation({
    mutationFn: (args: { id: string; status: string }) =>
      patchContractControl(args.id, { compliance_status: args.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-controls"] }),
  });

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
              <span className="font-mono text-xs">{d.code}</span> — {d.name}
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
              <th>Evidence (PDF)</th>
              <th>Compliance</th>
            </tr>
          </thead>
          <tbody>
            {(org.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-slate-500">
                  No contract controls recorded.
                </td>
              </tr>
            ) : (
              (org.data ?? []).map((c: ContractControlRow) => {
                const d = defById.get(c.control_definition_id);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 align-top">{d ? `${d.code} — ${d.name}` : c.control_definition_id}</td>
                    <td className="min-w-[220px] py-2 align-top">
                      <EvidenceAttachmentsPanel
                        entityType="contract_control"
                        entityId={c.id}
                        initialFiles={c.evidence_files}
                        invalidateQueryKeys={[["contract-controls"]]}
                      />
                    </td>
                    <td className="align-top">
                      <select
                        className="rounded border px-1 py-0.5 text-xs"
                        value={c.compliance_status}
                        onChange={(e) => patchM.mutate({ id: c.id, status: e.target.value })}
                      >
                        <option value="not_assessed">Not assessed</option>
                        <option value="compliant">Compliant</option>
                        <option value="partially_compliant">Partially compliant</option>
                        <option value="non_compliant">Non-compliant</option>
                      </select>
                    </td>
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
