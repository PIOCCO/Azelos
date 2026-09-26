import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import type { OwnerRequestItem } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import { PortalEmpty, PortalError, PortalLoading } from "../../components/owner/PortalStates";

export default function OwnerRequestsPage() {
  const { t } = useLocale();
  const [requests, setRequests] = useState<OwnerRequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await apiFetch<{ requests: OwnerRequestItem[] }>("/api/owner/requests");
    setLoading(false);
    if (err) setError(err);
    else setRequests(data?.requests ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.requests")}</h1>
        <Link to="/contact" className="btn-secondary">
          {t("ownerPortal.newRequestViaContact")}
        </Link>
      </div>
      <p className="text-sm text-ink-600">{t("ownerPortal.requestsHint")}</p>
      {error && <PortalError message={error} onRetry={load} />}
      {loading && <PortalLoading />}
      {!loading && !error && requests.length === 0 && <PortalEmpty message={t("ownerPortal.noRequests")} />}
      {!loading && requests.length > 0 && (
        <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
          {requests.map((r) => (
            <li key={r.id} className="px-4 py-4">
              <p className="font-semibold text-ink-900">{r.subject || t("ownerPortal.requestNoSubject")}</p>
              {r.message && <p className="mt-2 text-sm text-ink-600 line-clamp-3">{r.message}</p>}
              <time className="mt-2 block text-xs text-ink-400" dateTime={r.createdAt}>
                {new Date(r.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
