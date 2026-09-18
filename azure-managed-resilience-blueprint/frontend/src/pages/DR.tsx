import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";

export default function DR() {
  const { session } = useApp();
  const [dr, setDr] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    api(`/disaster-recovery?tenant_id=${session.tenantId}`).then(setDr);
  }, [session.tenantId]);
  if (!dr) return null;
  return (
    <>
      <PageHeader title="Disaster recovery" breadcrumb="Resilience / DR" />
      <div className="card">
        <p>Protected workloads: {String(dr.protected_vms)}</p>
        <p>
          Healthy: {String(dr.healthy)} · Warning: {String(dr.warning)} · Critical: {String(dr.critical)}
        </p>
        <p>Last DR test: {String(dr.last_dr_test ?? "Not recorded")}</p>
      </div>
    </>
  );
}
