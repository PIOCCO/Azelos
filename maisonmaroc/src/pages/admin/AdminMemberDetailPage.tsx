import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useLocale } from "../../lib/useLocale";
import type { Property } from "../../data/types";

type AdminMemberDetailPageProps = { adminBase?: string };

export default function AdminMemberDetailPage({ adminBase = "/admin" }: AdminMemberDetailPageProps) {
  const adminRoot = adminBase.replace(/\/$/, "") || "";
  const { id } = useParams();
  const { t, L } = useLocale();
  const [detail, setDetail] = useState<{
    user: { id: string; email: string; name: string; status: string; owner_profile_id: string; created_at: string };
    profile: { agency?: { fr: string; ar: string }; name?: { fr: string; ar: string } };
    memberProjects: (Property & { status: string; hidden?: boolean })[];
    activity: { id: string; action: string; createdAt: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const { data, error: err } = await apiFetch(`/api/admin/members/${id}`);
    if (err) setError(err);
    else setDetail(data as typeof detail);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="container-page py-8 text-red-600">{error}</p>;
  if (!detail) return <p className="container-page py-8 text-ink-500">{t("common.loading")}</p>;

  const suspend = async () => {
    const next = detail.user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await apiFetch(`/api/admin/members/${detail.user.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    load();
  };

  return (
    <div className="container-page space-y-6 py-8">
      <Link to={adminRoot || "/"} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft size={16} aria-hidden /> {t("adminDash.backToMembers")}
      </Link>
      <header className="rounded-2xl border border-ink-100 bg-white p-6">
        <h1 className="text-2xl font-bold text-navy">{L(detail.profile?.agency) || L(detail.profile?.name) || detail.user.name}</h1>
        <p className="mt-1 text-sm text-ink-600">{detail.user.email}</p>
        <p className="text-sm text-ink-500">
          {t("adminDash.status")}: {detail.user.status === "ACTIVE" ? t("adminDash.statusActive") : t("adminDash.statusSuspended")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={suspend}>
            {detail.user.status === "ACTIVE" ? t("adminDash.suspend") : t("adminDash.activate")}
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="text-lg font-bold text-navy">{t("adminDash.memberProjects")}</h2>
        <ul className="mt-4 divide-y divide-ink-100">
          {detail.memberProjects.length === 0 ? (
            <li className="py-3 text-sm text-ink-500">{t("adminDash.noMemberProjects")}</li>
          ) : (
            detail.memberProjects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>{L(p.title)}</span>
                <span className="text-xs font-bold uppercase text-ink-500">
                  {p.status} {p.hidden ? `· ${t("adminDash.hidden")}` : ""}
                </span>
                {p.slug && (
                  <Link to={`/property/${p.slug}`} className="text-sm text-brand-700 hover:underline">
                    {t("common.viewMore")}
                  </Link>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      {detail.activity.length > 0 && (
        <section className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="text-lg font-bold text-navy">{t("ownerPortal.recentActivity")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {detail.activity.map((a) => (
              <li key={a.id}>
                {a.action} · {new Date(a.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
