import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useLocale } from "../../lib/useLocale";

interface AdminProject {
  id: string;
  slug: string;
  title: { fr: string; ar: string };
  status: string;
  hidden?: boolean;
  ownerLabel?: string;
}

export default function AdminProjectsPage() {
  const { t, L } = useLocale();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const { data } = await apiFetch<{ projects: AdminProject[] }>(`/api/admin/member-projects${params}`);
    setProjects(data?.projects ?? []);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const hide = async (id: string, hidden: boolean) => {
    await apiFetch(`/api/admin/member-projects/${id}`, { method: "PATCH", body: JSON.stringify({ hidden }) });
    load();
  };

  return (
    <div className="container-page space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">{t("adminDash.tabProjects")}</h1>
        <Link to="/admin" className="text-sm font-semibold text-brand-700 hover:underline">
          {t("adminDash.backToMembers")}
        </Link>
      </div>
      <input className="input max-w-md" placeholder={t("ownerPortal.searchProjects")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-start">{t("adminDash.titleFr")}</th>
              <th className="px-4 py-3 text-start">{t("adminDash.member")}</th>
              <th className="px-4 py-3">{t("adminDash.status")}</th>
              <th className="px-4 py-3">{t("adminDash.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">{L(p.title)}</td>
                <td className="px-4 py-3">{p.ownerLabel}</td>
                <td className="px-4 py-3">{p.status}{p.hidden ? ` (${t("adminDash.hidden")})` : ""}</td>
                <td className="px-4 py-3 space-x-2">
                  {p.slug && (
                    <Link to={`/property/${p.slug}`} className="text-brand-700 hover:underline">
                      {t("common.viewMore")}
                    </Link>
                  )}
                  <button type="button" className="text-brand-700 hover:underline" onClick={() => hide(p.id, !p.hidden)}>
                    {p.hidden ? t("adminDash.unhide") : t("adminDash.hide")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
