import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, SearchX } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useListings } from "../context/ListingsContext";
import {
  filterProperties,
  sortProperties,
  type PropertyFilters,
  type SortKey,
} from "../lib/filter";
import { defaultFilters, filtersToSearchParams, parseFilters } from "../lib/searchParams";
import PropertyCard from "../components/PropertyCard";
import FilterSidebar from "../components/FilterSidebar";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { formatNumber } from "../lib/format";

const PAGE_SIZE = 9;

export default function SearchPage() {
  const { t, lang, isRTL } = useLocale();
  const { properties } = useListings();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<PropertyFilters>(() => parseFilters(params));
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setFilters(parseFilters(params));
    setPage(1);
  }, [params]);

  const results = useMemo(() => {
    const filtered = filterProperties(properties, filters);
    return sortProperties(filtered, sort);
  }, [filters, sort, properties]);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paged = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleChange = (f: PropertyFilters) => {
    setFilters(f);
    setPage(1);
    setParams(filtersToSearchParams(f), { replace: true });
  };
  const handleReset = () => {
    const reset = defaultFilters();
    setFilters(reset);
    setParams(filtersToSearchParams(reset), { replace: true });
    setPage(1);
  };

  const filterPanel = (
    <div className="surface-panel lg:sticky lg:top-[128px]">
      <FilterSidebar filters={filters} onChange={handleChange} onReset={handleReset} />
    </div>
  );

  return (
    <div className="page-shell">
      <div className="container-page fade-in">
        <PageHeader
          title={t("search.title")}
          description={
            <>
              <span className="font-bold text-brand-600">
                {formatNumber(results.length, lang)}
              </span>{" "}
              {t("search.resultsFound")}
            </>
          }
          actions={
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="btn-outline lg:hidden"
            >
              <SlidersHorizontal size={16} /> {t("search.mobileFilters")}
            </button>
          }
        />

        <div
          className={`grid gap-6 ${
            isRTL ? "lg:grid-cols-[1fr_300px]" : "lg:grid-cols-[300px_1fr]"
          }`}
        >
          {!isRTL && <aside className="hidden lg:block">{filterPanel}</aside>}

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <span className="font-semibold">{t("search.sortBy")}</span>
                <select
                  className="input w-auto py-2 text-sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="newest">{t("search.sortNewest")}</option>
                  <option value="priceAsc">{t("search.sortPriceAsc")}</option>
                  <option value="priceDesc">{t("search.sortPriceDesc")}</option>
                  <option value="surface">{t("search.sortSurface")}</option>
                </select>
              </label>
            </div>

            {paged.length === 0 ? (
              <EmptyState
                icon={<SearchX size={48} />}
                title={t("common.noResults")}
                description={t("common.noResultsHint")}
                action={
                  <button type="button" onClick={handleReset} className="btn-outline">
                    {t("search.clearAll")}
                  </button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paged.map((p) => (
                  <PropertyCard key={p.id} property={p} variant="compact" />
                ))}
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>

          {isRTL && <aside className="hidden lg:block">{filterPanel}</aside>}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" aria-hidden />
          <div
            className="absolute inset-y-0 end-0 flex w-[min(100%,22rem)] flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("common.filters")}
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <h3 className="text-lg font-bold">{t("common.filters")}</h3>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterSidebar filters={filters} onChange={handleChange} onReset={handleReset} />
            </div>
            <div className="border-t border-ink-100 p-4">
              <button type="button" onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                {t("common.apply")} ({formatNumber(results.length, lang)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
