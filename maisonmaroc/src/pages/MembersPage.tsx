import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useListings } from "../context/ListingsContext";
import OwnerCard from "../components/OwnerCard";
import PageHeader from "../components/PageHeader";
import PageMeta from "../components/PageMeta";
import Pagination from "../components/Pagination";
import { cities } from "../data/cities";

const PAGE_SIZE = 12;

export default function MembersPage() {
  const { t, L, lang } = useLocale();
  const { owners } = useListings();
  const [q, setQ] = useState("");
  const [cityId, setCityId] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...owners]
      .filter((o) => {
        if (cityId && o.cityId !== cityId) return false;
        if (!query) return true;
        const name = L(o.name).toLowerCase();
        const bio = L(o.bio).toLowerCase();
        return name.includes(query) || bio.includes(query);
      })
      .sort((a, b) => L(a.name).localeCompare(L(b.name), lang));
  }, [owners, q, cityId, L, lang]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page-shell">
      <PageMeta title={t("inst.members.metaTitle")} description={t("inst.members.description")} path="/membres" />
      <div className="container-page">
        <PageHeader title={t("inst.members.title")} description={t("inst.members.description")} />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {t("common.search")}
            </span>
            <span className="relative mt-1 flex">
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
              <input
                type="search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="input w-full ps-10"
                placeholder={t("inst.members.searchPlaceholder")}
                aria-label={t("inst.members.searchPlaceholder")}
              />
            </span>
          </label>
          <label className="sm:w-48">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {t("home.city")}
            </span>
            <select
              className="input mt-1 w-full"
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("home.anyCity")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {L(c.name)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {paged.length === 0 ? (
          <p className="py-12 text-center text-ink-600">{t("common.noResults")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paged.map((o) => (
              <OwnerCard key={o.id} owner={o} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
