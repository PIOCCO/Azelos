import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import type { OwnerActivityItem, OwnerDashboardData } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import ProfileCompletionBar from "../../components/owner/ProfileCompletionBar";
import { PortalError, PortalLoading } from "../../components/owner/PortalStates";

export default function OwnerHomePage() {
  const { t } = useLocale();
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [activity, setActivity] = useState<OwnerActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [dash, act] = await Promise.all([
      apiFetch<OwnerDashboardData>("/api/owner/dashboard"),
      apiFetch<{ activity: OwnerActivityItem[] }>("/api/owner/activity"),
    ]);
    if (dash.error) setError(dash.error);
    else setData(dash.data ?? null);
    if (!act.error) setActivity(act.data?.activity ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.dashboard")}</h1>
        <div className="mt-6">
          <PortalError message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.dashboard")}</h1>
        <div className="mt-6">
          <PortalLoading lines={5} />
        </div>
      </div>
    );
  }

  const stats = [
    { label: t("ownerPortal.stats.profile"), value: `${data.stats.profileCompletion}%`, to: "/owner/profile" },
    { label: t("ownerPortal.stats.projects"), value: data.stats.catalogProjects + data.stats.draftProjects, to: "/owner/projects" },
    { label: t("ownerPortal.stats.published"), value: data.stats.catalogProjects, to: "/owner/projects" },
    { label: t("ownerPortal.stats.pending"), value: data.stats.pendingProjects, to: "/owner/projects?status=pending" },
    { label: t("ownerPortal.stats.documents"), value: data.stats.memberDocuments, to: "/owner/documents" },
    { label: t("ownerPortal.stats.messages"), value: data.stats.unreadMessages, to: "/owner/messages" },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-ink-500">{t("ownerPortal.welcome")}</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">{data.welcomeName}</h1>
        <p className="mt-2 text-sm text-ink-600">{t("ownerPortal.welcomeSubtitle")}</p>
      </header>

      <ProfileCompletionBar completion={data.profileCompletion} />

      <section aria-labelledby="owner-stats-heading">
        <h2 id="owner-stats-heading" className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">
          {t("ownerPortal.keyIndicators")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm transition hover:border-navy/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <p className="text-xs font-semibold text-ink-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-navy">{s.value}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm" aria-labelledby="owner-activity-heading">
        <div className="flex items-center justify-between gap-2">
          <h2 id="owner-activity-heading" className="text-sm font-bold text-navy">
            {t("ownerPortal.recentActivity")}
          </h2>
          <Link to="/owner/notifications" className="text-xs font-semibold text-brand-700 hover:underline">
            {t("ownerPortal.viewAll")}
          </Link>
        </div>
        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">{t("ownerPortal.noActivity")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink-100">
            {activity.slice(0, 8).map((a) => (
              <li key={a.id} className="py-3 text-sm text-ink-700">
                <span className="font-medium">{t(`ownerPortal.activity.${a.action}`, { defaultValue: a.action })}</span>
                {a.detail ? <span className="text-ink-500"> — {a.detail.slice(0, 40)}</span> : null}
                <time className="mt-1 block text-xs text-ink-400" dateTime={a.createdAt}>
                  {new Date(a.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
