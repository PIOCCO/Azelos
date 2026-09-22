import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { cities } from "../data/cities";
import { propertyTypeKeys } from "../data/meta";

export default function SearchBar() {
  const { t, L } = useLocale();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");

  const selectedCity = cities.find((c) => c.id === city);

  const submit = () => {
    const params = new URLSearchParams();
    if (transaction) params.set("transaction", transaction);
    if (city) params.set("city", city);
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (type) params.set("type", type);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 inline-flex rounded-xl bg-ink-100 p-1">
        {[
          { v: "", label: t("common.all") },
          { v: "sale", label: t("transactions.buy") },
          { v: "rent", label: t("transactions.rentAction") },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => setTransaction(o.v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              transaction === o.v
                ? "bg-white text-brand-700 shadow-sm"
                : "text-ink-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div>
          <label className="field-label">{t("home.city")}</label>
          <select
            className="input"
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
        <div>
          <label className="field-label">{t("home.neighborhood")}</label>
          <select
            className="input"
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
          <label className="field-label">{t("home.propertyType")}</label>
          <select
            className="input"
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
        <div>
          <label className="field-label">{t("home.bedrooms")}</label>
          <select
            className="input"
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
        <div>
          <label className="field-label">{t("home.minPrice")}</label>
          <input
            className="input"
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
            className="input"
            type="number"
            inputMode="numeric"
            dir="ltr"
            placeholder="∞"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <div className="col-span-2 flex items-end">
          <button onClick={submit} className="btn-primary h-[46px] w-full text-base">
            <Search size={18} /> {t("home.searchNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
