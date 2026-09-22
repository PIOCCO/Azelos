import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, SlidersHorizontal, X, SearchX } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { properties } from "../data/properties";
import {
  filterProperties,
  sortProperties,
  type PropertyFilters,
  type SortKey,
} from "../lib/filter";
import PropertyCard from "../components/PropertyCard";
import FilterSidebar from "../components/FilterSidebar";
import Pagination from "../components/Pagination";
import { formatNumber } from "../lib/format";
import type { PropertyType, TransactionType } from "../data/types";

const PAGE_SIZE = 9;

function parseFilters(params: URLSearchParams): PropertyFilters {
  const num = (k: string) =>
    params.get(k) ? Number(params.get(k)) : undefined;
  return {
    transaction: (params.get("transaction") as TransactionType) || "",
    city: params.get("city") || "",
    neighborhood: params.get("neighborhood") || "",
    type: (params.get("type") as PropertyType) || "",
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    bedrooms: num("bedrooms"),
    verifiedOnly: params.get("verified") === "1",
  };
}

export default function SearchPage() {
  const { t, lang } = useLocale();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<PropertyFilters>(() =>
    parseFilters(params),
  );
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync when URL changes (e.g. navigating from home search / city links)
  useEffect(() => {
    setFilters(parseFilters(params));
    setPage(1);
  }, [params]);

  const results = useMemo(() => {
    const filtered = filterProperties(properties, filters);
    return sortProperties(filtered, sort);
  }, [filters, sort]);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paged = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleChange = (f: PropertyFilters) => {
    setFilters(f);
    setPage(1);
  };
  const handleReset = () => {
    setFilters({});
    setParams({});
    setPage(1);
  };

  return (
    <div className="container-page py-6 lg:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{t("search.title")}</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            <span className="font-bold text-brand-700">
              {formatNumber(results.length, lang)}
            </span>{" "}
            {t("search.resultsFound")}
          </p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="btn-outline lg:hidden"
        >
          <SlidersHorizontal size={16} /> {t("search.mobileFilters")}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="card sticky top-20 p-5">
            <FilterSidebar
              filters={filters}
              onChange={handleChange}
              onReset={handleReset}
            />
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex overflow-hidden rounded-lg border border-ink-200">
              <button
                onClick={() => setView("grid")}
                className={`grid h-9 w-10 place-items-center ${
                  view === "grid" ? "bg-brand-600 text-white" : "text-ink-500"
                }`}
                aria-label={t("search.gridView")}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`grid h-9 w-10 place-items-center ${
                  view === "list" ? "bg-brand-600 text-white" : "text-ink-500"
                }`}
                aria-label={t("search.listView")}
              >
                <List size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-500">{t("search.sortBy")}</span>
              <select
                className="input w-auto py-2"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="newest">{t("search.sortNewest")}</option>
                <option value="priceAsc">{t("search.sortPriceAsc")}</option>
                <option value="priceDesc">{t("search.sortPriceDesc")}</option>
                <option value="surface">{t("search.sortSurface")}</option>
              </select>
            </div>
          </div>

          {paged.length === 0 ? (
            <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
              <SearchX size={48} className="text-ink-300" />
              <p className="text-lg font-bold text-ink-800">
                {t("common.noResults")}
              </p>
              <p className="max-w-sm text-sm text-ink-500">
                {t("common.noResultsHint")}
              </p>
              <button onClick={handleReset} className="btn-outline mt-2">
                {t("search.clearAll")}
              </button>
            </div>
          ) : (
            <div
              className={
                view === "grid"
                  ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4"
              }
            >
              {paged.map((p) => (
                <PropertyCard key={p.id} property={p} layout={view} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute inset-y-0 end-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{t("common.filters")}</h3>
              <button
                onClick={() => setMobileOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            <FilterSidebar
              filters={filters}
              onChange={handleChange}
              onReset={handleReset}
            />
            <button
              onClick={() => setMobileOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              {t("common.apply")} ({formatNumber(results.length, lang)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
