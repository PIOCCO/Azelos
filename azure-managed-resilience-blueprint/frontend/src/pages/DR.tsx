import { useEffect, useState } from "react";
import { api } from "../api";

export default function DR({ tenant }: { tenant: string }) {
  const [dr, setDr] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    api(`/disaster-recovery?tenant_id=${tenant}`).then(setDr);
  }, [tenant]);
  if (!dr) return null;
  return (
    <div className="card">
      <h2>Disaster Recovery</h2>
      <p>Protected VMs: {String(dr.protected_vms)}</p>
      <p>
        Healthy: {String(dr.healthy)} · Warning: {String(dr.warning)} · Critical: {String(dr.critical)}
      </p>
      <p>Last DR test: {String(dr.last_dr_test)}</p>
    </div>
  );
}
