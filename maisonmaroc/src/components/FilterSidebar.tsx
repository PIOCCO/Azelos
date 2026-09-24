import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import type { AmenityKey, PropertyType, TransactionType } from "../data/types";
import type { PropertyFilters } from "../lib/filter";
import { useLocale } from "../lib/useLocale";
import { cities } from "../data/cities";
import { propertyTypeKeys } from "../data/meta";

const FILTER_AMENITIES: AmenityKey[] = [
  "parking",
  "pool",
  "garden",
  "elevator",
  "seaView",
  "furnished",
  "security",
  "airConditioning",
];

interface Props {
  filters: PropertyFilters;
  onChange: (f: PropertyFilters) => void;
  onReset: () => void;
}

export default function FilterSidebar({ filters, onChange, onReset }: Props) {
  const { t, L } = useLocale();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const set = (patch: Partial<PropertyFilters>) =>
    onChange({ ...filters, ...patch });

  const selectedCity = cities.find((c) => c.id === filters.city);

  const toggleAmenity = (a: AmenityKey) => {
    const cur = filters.amenities ?? [];
    set({
      amenities: cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a],
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink-900">{t("common.filters")}</h3>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          <RotateCcw size={13} /> {t("search.clearAll")}
        </button>
      </div>

      <div>
        <label className="field-label">{t("search.transaction")}</label>
        <div className="inline-flex w-full rounded-xl bg-ink-100 p-1">
          {[
            { v: "", label: t("common.all") },
            { v: "sale", label: t("transactions.sale") },
            { v: "rent", label: t("transactions.rent") },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => set({ transaction: o.v as TransactionType | "" })}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                (filters.transaction ?? "") === o.v
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-ink-600"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">{t("home.city")}</label>
        <select
          className="input"
          value={filters.city ?? ""}
          onChange={(e) => set({ city: e.target.value, neighborhood: "" })}
        >
          <option value="">{t("home.anyCity")}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {L(c.name)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label">{t("home.propertyType")}</label>
        <select
          className="input"
          value={filters.type ?? ""}
          onChange={(e) => set({ type: e.target.value as PropertyType | "" })}
        >
          <option value="">{t("home.anyType")}</option>
          {propertyTypeKeys.map((k) => (
            <option key={k} value={k}>
              {t(`types.${k}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label">{t("search.priceRange")}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            dir="ltr"
            className="input"
            placeholder={t("home.minPrice")}
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              set({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
          <span className="text-ink-400">—</span>
          <input
            type="number"
            dir="ltr"
            className="input"
            placeholder={t("home.maxPrice")}
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </div>

      <div>
        <label className="field-label">{t("home.bedrooms")}</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                set({ bedrooms: filters.bedrooms === n ? undefined : n })
              }
              className={`h-9 flex-1 rounded-lg text-sm font-semibold transition ${
                filters.bedrooms === n
                  ? "bg-brand-600 text-white"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        aria-expanded={advancedOpen}
      >
        {t("search.moreFilters")}
        <ChevronDown
          size={18}
          className={`transition ${advancedOpen ? "rotate-180" : ""}`}
        />
      </button>

      {advancedOpen && (
        <div className="space-y-5 border-s-2 border-brand-100 ps-3">
          <div>
            <label className="field-label">{t("home.neighborhood")}</label>
            <select
              className="input"
              value={filters.neighborhood ?? ""}
              onChange={(e) => set({ neighborhood: e.target.value })}
              disabled={!selectedCity}
            >
              <option value="">{t("home.anyNeighborhood")}</option>
              {selectedCity?.neighborhoods.map((n) => (
                <option key={n.fr} value={n.fr}>
                  {L(n)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">{t("search.surfaceRange")}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                dir="ltr"
                className="input"
                placeholder={t("common.from")}
                value={filters.minSurface ?? ""}
                onChange={(e) =>
                  set({
                    minSurface: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <span className="text-ink-400">—</span>
              <input
                type="number"
                dir="ltr"
                className="input"
                placeholder={t("common.to")}
                value={filters.maxSurface ?? ""}
                onChange={(e) =>
                  set({
                    maxSurface: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="field-label">{t("search.bathrooms")}</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    set({ bathrooms: filters.bathrooms === n ? undefined : n })
                  }
                  className={`h-9 flex-1 rounded-lg text-sm font-semibold transition ${
                    filters.bathrooms === n
                      ? "bg-brand-600 text-white"
                      : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                  }`}
                >
                  {n}+
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">{t("search.features")}</label>
            <div className="grid grid-cols-2 gap-2">
              {FILTER_AMENITIES.map((a) => {
                const active = (filters.amenities ?? []).includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-600 hover:border-brand-200"
                    }`}
                  >
                    {t(`amenities.${a}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-300"
              checked={filters.verifiedOnly ?? false}
              onChange={(e) => set({ verifiedOnly: e.target.checked })}
            />
            {t("search.verifiedOnly")}
          </label>
        </div>
      )}
    </div>
  );
}
