import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, LogOut, MessageSquare } from "lucide-react";
import { useMessaging } from "../context/MessagingContext";
import { useLocale } from "../lib/useLocale";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

interface OwnerProperty {
  id: string;
  slug: string;
  title: { fr: string; ar: string };
}

export default function OwnerDashboardPage() {
  const { t, L } = useLocale();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { unreadCount } = useMessaging();

  useEffect(() => {
    apiFetch<{ properties: OwnerProperty[] }>("/api/owner/properties").then(({ data, error: err }) => {
      if (err) setError(err);
      else setProperties(data?.properties ?? []);
    });
  }, []);

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{t("ownerDash.title")}</h1>
          <p className="text-sm text-ink-500">{user?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/owner/messages" className="btn-primary inline-flex items-center gap-2">
            <MessageSquare size={16} /> {t("nav.messages")}
            {unreadCount > 0 && (
              <span className="rounded-full bg-white/20 px-2 text-xs">{unreadCount}</span>
            )}
          </Link>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={async () => {
              await logout();
              navigate("/owner/login");
            }}
          >
            <LogOut size={16} /> {t("nav.logout")}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-800">
          <Building2 size={20} className="text-brand-600" />
          {t("ownerDash.myProperties")}
        </h2>
        {properties.length === 0 ? (
          <p className="mt-4 text-sm text-ink-500">{t("ownerDash.noProperties")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
            {properties.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium text-ink-800">{L(p.title)}</span>
                <Link to={`/property/${p.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
                  {t("common.viewMore")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
