import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, SlidersHorizontal, X, SearchX, Map } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useListings } from "../context/ListingsContext";
import {
  filterProperties,
  sortProperties,
  type PropertyFilters,
  type SortKey,
} from "../lib/filter";
import { filtersToSearchParams, parseFilters } from "../lib/searchParams";
import PropertyCard from "../components/PropertyCard";
import FilterSidebar from "../components/FilterSidebar";
import Pagination from "../components/Pagination";
import { formatNumber } from "../lib/format";
import { cityById } from "../data/cities";

const PAGE_SIZE = 9;

export default function SearchPage() {
  const { t, lang, isRTL } = useLocale();
  const { properties } = useListings();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<PropertyFilters>(() =>
    parseFilters(params),
  );
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

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

  const mapCity = filters.city ? cityById(filters.city) : null;
  const mapSrc = mapCity
    ? `https://www.openstreetmap.org/export/embed.html?bbox=-8.5%2C33.4%2C-6.2%2C34.1&layer=mapnik`
    : `https://www.openstreetmap.org/export/embed.html?bbox=-13.5%2C27.5%2C-0.5%2C36.0&layer=mapnik`;

  const handleChange = (f: PropertyFilters) => {
    setFilters(f);
    setPage(1);
    setParams(filtersToSearchParams(f), { replace: true });
  };
  const handleReset = () => {
    setFilters({});
    setParams({});
    setPage(1);
  };

  const filterPanel = (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm lg:sticky lg:top-[120px]">
      <FilterSidebar filters={filters} onChange={handleChange} onReset={handleReset} />
    </div>
  );

  const resultsPanel = (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3">
        <div className="inline-flex overflow-hidden rounded-lg border border-ink-200">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`grid h-9 w-10 place-items-center ${
              view === "grid" ? "bg-brand-600 text-white" : "text-ink-500"
            }`}
            aria-label={t("search.gridView")}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`grid h-9 w-10 place-items-center ${
              view === "list" ? "bg-brand-600 text-white" : "text-ink-500"
            }`}
            aria-label={t("search.listView")}
          >
            <List size={18} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMap((m) => !m)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${
              showMap ? "bg-brand-600 text-white" : "border border-ink-200 text-ink-600"
            }`}
          >
            <Map size={14} /> {t("search.showMap")}
          </button>
          <span className="text-sm text-ink-500">{t("search.sortBy")}</span>
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
        </div>
      </div>

      {showMap && (
        <div className="mb-4 overflow-hidden rounded-xl border border-ink-200 shadow-sm">
          <iframe title="map" src={mapSrc} className="h-48 w-full border-0 sm:h-56" loading="lazy" />
        </div>
      )}

      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-ink-100 bg-white py-20 text-center">
          <SearchX size={48} className="text-ink-300" />
          <p className="text-lg font-bold text-ink-800">{t("common.noResults")}</p>
          <p className="max-w-sm text-sm text-ink-500">{t("common.noResultsHint")}</p>
          <button type="button" onClick={handleReset} className="btn-outline mt-2">
            {t("search.clearAll")}
          </button>
        </div>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
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
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="border-b border-ink-200 bg-white py-6">
        <div className="container-page">
          <h1 className="text-2xl font-extrabold text-ink-900">{t("search.title")}</h1>
          <p className="mt-1 text-sm text-ink-500">
            <span className="font-extrabold text-brand-600">
              {formatNumber(results.length, lang)}
            </span>{" "}
            {t("search.resultsFound")}
          </p>
        </div>
      </div>

      <div className="container-page py-6 lg:py-8">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="btn-outline mb-4 lg:hidden"
        >
          <SlidersHorizontal size={16} /> {t("search.mobileFilters")}
        </button>

        <div
          className={`grid gap-6 ${
            isRTL ? "lg:grid-cols-[1fr_280px]" : "lg:grid-cols-[280px_1fr]"
          }`}
        >
          {!isRTL && <aside className="hidden lg:block">{filterPanel}</aside>}
          {resultsPanel}
          {isRTL && <aside className="hidden lg:block">{filterPanel}</aside>}
        </div>
      </div>

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
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            <FilterSidebar filters={filters} onChange={handleChange} onReset={handleReset} />
            <button
              type="button"
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
