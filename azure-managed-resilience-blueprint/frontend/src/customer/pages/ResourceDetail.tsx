import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { customerApi } from "../api";
import { PageHeader } from "../../components/PageHeader";

export default function ResourceDetail() {
  const { resourceId } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (resourceId) customerApi(`/infrastructure/${resourceId}`).then(setData);
  }, [resourceId]);
  if (!data) return null;
  const r = data.resource as Record<string, unknown>;
  return (
    <>
      <PageHeader title={String(r.name)} breadcrumb="Infrastructure / Resource" />
      <div className="card">
        <p>Type: {String(r.resource_type)}</p>
        <p>Resource group: {String(r.resource_group)}</p>
        <p>Region: {String(r.location)}</p>
        <p>Health: {String(r.health_status)}</p>
        <p>Current month: ${String(r.monthly_cost_usd ?? "—")}</p>
        <p>Backup: {r.backup_protected ? "Protected" : "Not protected"}</p>
      </div>
    </>
  );
}
