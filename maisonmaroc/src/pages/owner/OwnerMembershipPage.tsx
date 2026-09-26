import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { OwnerMembership } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import { PortalError, PortalLoading } from "../../components/owner/PortalStates";

export default function OwnerMembershipPage() {
  const { t, L } = useLocale();
  const [data, setData] = useState<OwnerMembership | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: d, error: err } = await apiFetch<OwnerMembership>("/api/owner/membership");
    if (err) setError(err);
    else setData(d ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.membership")}</h1>
        <div className="mt-6">
          <PortalError message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.membership")}</h1>
        <div className="mt-6">
          <PortalLoading />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.membership")}</h1>
      <dl className="grid gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase text-ink-500">{t("ownerPortal.membershipStatus")}</dt>
          <dd className="mt-1 text-lg font-semibold text-navy">{data.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-ink-500">{t("ownerPortal.memberId")}</dt>
          <dd className="mt-1 font-mono text-sm text-ink-800">{data.ownerProfileId}</dd>
        </div>
        {data.memberSince && (
          <div>
            <dt className="text-xs font-bold uppercase text-ink-500">{t("ownerPortal.memberSince")}</dt>
            <dd className="mt-1 text-ink-900">{new Date(data.memberSince).toLocaleDateString()}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-bold uppercase text-ink-500">{t("ownerPortal.validation")}</dt>
          <dd className="mt-1 text-ink-900">{data.verified ? t("common.verified") : t("ownerPortal.notVerified")}</dd>
        </div>
        {data.agency && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase text-ink-500">{t("ownerPortal.companyName")}</dt>
            <dd className="mt-1 text-ink-900">{L(data.agency)}</dd>
          </div>
        )}
      </dl>
      <p className="text-xs text-ink-500">{t("ownerPortal.membershipNote")}</p>
    </div>
  );
}
