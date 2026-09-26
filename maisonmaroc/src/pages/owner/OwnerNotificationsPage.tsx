import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import type { OwnerActivityItem } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import { useMessaging } from "../../context/MessagingContext";
import { PortalEmpty, PortalError, PortalLoading } from "../../components/owner/PortalStates";

export default function OwnerNotificationsPage() {
  const { t } = useLocale();
  const { unreadCount } = useMessaging();
  const [activity, setActivity] = useState<OwnerActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await apiFetch<{ activity: OwnerActivityItem[] }>("/api/owner/activity");
    setLoading(false);
    if (err) setError(err);
    else setActivity(data?.activity ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.notifications")}</h1>
      <p className="text-sm text-ink-600">{t("ownerPortal.notificationsHint")}</p>

      {unreadCount > 0 && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
          <Link to="/owner/messages" className="font-semibold text-brand-800 hover:underline">
            {t("ownerPortal.unreadMessages", { count: unreadCount })}
          </Link>
        </div>
      )}

      {error && <PortalError message={error} onRetry={load} />}
      {loading && <PortalLoading />}
      {!loading && !error && activity.length === 0 && unreadCount === 0 && (
        <PortalEmpty message={t("ownerPortal.noNotifications")} />
      )}
      {!loading && activity.length > 0 && (
        <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
          {activity.map((a) => (
            <li key={a.id} className="px-4 py-4 text-sm">
              <span className="font-semibold text-navy">{t(`ownerPortal.activity.${a.action}`, { defaultValue: a.action })}</span>
              {a.detail && <p className="mt-1 text-ink-600">{a.detail}</p>}
              <time className="mt-2 block text-xs text-ink-400" dateTime={a.createdAt}>
                {new Date(a.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
