import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { cities, DEFAULT_CITY_ID } from "../data/cities";
import { propertyTypeKeys } from "../data/meta";

export default function SearchBar({ hero = false }: { hero?: boolean }) {
  const { t, L } = useLocale();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY_ID);
  const [neighborhood, setNeighborhood] = useState("");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  const selectedCity = cities.find((c) => c.id === city);

  const submit = () => {
    const params = new URLSearchParams();
    if (transaction) params.set("transaction", transaction);
    params.set("city", city || DEFAULT_CITY_ID);
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (type) params.set("type", type);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    navigate(`/search?${params.toString()}`);
  };

  const tabs = [
    { v: "sale", label: t("transactions.sale") },
    { v: "rent", label: t("transactions.rent") },
    { v: "", label: t("common.all") },
  ];

  const fieldClass = hero ? "input-hero" : "input";
  const wrapClass = hero
    ? "rounded-2xl bg-white p-3 shadow-search sm:p-4"
    : "card p-4 sm:p-5";

  return (
    <div className={wrapClass}>
      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((o) => (
          <button
            key={o.v || "all"}
            type="button"
            onClick={() => setTransaction(o.v)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              transaction === o.v
                ? "bg-brand-600 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <label className="field-label">{t("home.propertyType")}</label>
            <select
              className={fieldClass}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">{t("home.anyType")}</option>
              {propertyTypeKeys.map((k) => (
                <option key={k} value={k}>
                  {t(`types.${k}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <label className="field-label">{t("home.city")}</label>
            <select
              className={fieldClass}
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setNeighborhood("");
              }}
            >
              <option value="">{t("home.anyCity")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {L(c.name)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <label className="field-label">{t("home.neighborhood")}</label>
            <select
              className={fieldClass}
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
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
            <label className="field-label">{t("home.minPrice")}</label>
            <input
              className={fieldClass}
              type="number"
              inputMode="numeric"
              dir="ltr"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">{t("home.maxPrice")}</label>
            <input
              className={fieldClass}
              type="number"
              inputMode="numeric"
              dir="ltr"
              placeholder="∞"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">{t("home.bedrooms")}</label>
            <select
              className={fieldClass}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            >
              <option value="">{t("home.anyBedrooms")}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          className="flex h-[46px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 lg:h-[46px] lg:w-[52px]"
          aria-label={t("home.searchNow")}
        >
          <Search size={22} />
          <span className="font-bold lg:sr-only">{t("home.searchNow")}</span>
        </button>
      </div>
    </div>
  );
}
