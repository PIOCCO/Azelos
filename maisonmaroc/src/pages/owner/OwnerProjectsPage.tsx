import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { apiFetch } from "../../lib/api";
import type { OwnerProjectListItem } from "../../lib/ownerPortalTypes";
import { useLocale } from "../../lib/useLocale";
import ProjectStatusBadge from "../../components/owner/ProjectStatusBadge";
import { PortalEmpty, PortalError, PortalLoading } from "../../components/owner/PortalStates";

export default function OwnerProjectsPage() {
  const { t, L } = useLocale();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<OwnerProjectListItem[]>([]);
  const [drafts, setDrafts] = useState<OwnerProjectListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const path = `/api/owner/projects${params.toString() ? `?${params}` : ""}`;
    const { data, error: err } = await apiFetch<{ catalog: OwnerProjectListItem[]; drafts: OwnerProjectListItem[] }>(path);
    setLoading(false);
    if (err) setError(err);
    else {
      setCatalog(data?.catalog ?? []);
      setDrafts(data?.drafts ?? []);
    }
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  const allDrafts = useMemo(() => drafts, [drafts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">{t("ownerPortal.nav.projects")}</h1>
        <Link to="/owner/projects/new" className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} aria-hidden />
          {t("ownerPortal.addProject")}
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} aria-hidden />
          <input
            className="input w-full ps-9"
            placeholder={t("ownerPortal.searchProjects")}
            value={q}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set("q", e.target.value);
              else next.delete("q");
              setSearchParams(next);
            }}
          />
        </div>
        <select
          className="input sm:w-48"
          value={status}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value) next.set("status", e.target.value);
            else next.delete("status");
            setSearchParams(next);
          }}
          aria-label={t("ownerPortal.filterStatus")}
        >
          <option value="">{t("ownerPortal.allStatuses")}</option>
          <option value="draft">{t("ownerPortal.projectStatus.draft")}</option>
          <option value="pending">{t("ownerPortal.projectStatus.pending")}</option>
          <option value="archived">{t("ownerPortal.projectStatus.archived")}</option>
        </select>
      </div>

      {error && <PortalError message={error} onRetry={load} />}
      {loading && <PortalLoading lines={4} />}

      {!loading && !error && (
        <>
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">{t("ownerPortal.myDrafts")}</h2>
            {allDrafts.length === 0 ? (
              <PortalEmpty message={t("ownerPortal.noDraftProjects")} actionLabel={t("ownerPortal.addProject")} onAction={() => navigate("/owner/projects/new")} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-stone-50 text-start text-ink-600">
                    <tr>
                      <th className="px-4 py-3">{t("adminDash.titleFr")}</th>
                      <th className="px-4 py-3">{t("ownerPortal.status")}</th>
                      <th className="px-4 py-3">{t("ownerPortal.updated")}</th>
                      <th className="px-4 py-3">{t("adminDash.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {allDrafts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-medium text-ink-900">{L(p.title) || p.id.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <ProjectStatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3 text-ink-500">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">
                          <Link to={`/owner/projects/${p.id}`} className="font-semibold text-brand-700 hover:underline">
                            {t("ownerPortal.edit")}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">{t("ownerPortal.catalogPublished")}</h2>
            {catalog.length === 0 ? (
              <p className="text-sm text-ink-500">{t("ownerPortal.noCatalogProjects")}</p>
            ) : (
              <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100 bg-white">
                {catalog.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium text-ink-900">{L(p.title)}</p>
                      <ProjectStatusBadge status="published" />
                    </div>
                    {p.slug && (
                      <Link to={`/property/${p.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
                        {t("common.viewMore")}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
