import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { cities, DEFAULT_CITY_ID } from "../data/cities";
import { propertyTypeKeys } from "../data/meta";

export default function SearchBar({ hero = false }: { hero?: boolean }) {
  const { t, L } = useLocale();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY_ID);
  const [type, setType] = useState("");

  const submit = () => {
    const params = new URLSearchParams();
    if (transaction) params.set("transaction", transaction);
    params.set("city", city || DEFAULT_CITY_ID);
    if (type) params.set("type", type);
    navigate(`/search?${params.toString()}`);
  };

  const tabs = [
    { v: "sale", label: t("transactions.sale") },
    { v: "rent", label: t("transactions.rent") },
    { v: "", label: t("common.all") },
  ];

  if (hero) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-search sm:p-5">
        <div className="mb-4 inline-flex w-full rounded-xl bg-ink-100 p-1 sm:w-auto">
          {tabs.map((o) => (
            <button
              key={o.v || "all"}
              type="button"
              onClick={() => setTransaction(o.v)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
                transaction === o.v
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-ink-600 hover:text-ink-800"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">{t("home.city")}</label>
              <select
                className="input-hero"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
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
                className="input-hero"
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
          </div>
          <button type="button" onClick={submit} className="btn-primary w-full sm:w-auto sm:min-w-[160px]">
            <Search size={20} />
            {t("home.searchNow")}
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-500 sm:text-start">
          <Link to="/search" className="font-semibold text-brand-700 hover:underline">
            {t("search.advancedFilters")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 sm:p-5">
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
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
          <div>
            <label className="field-label">{t("home.city")}</label>
            <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {L(c.name)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">{t("home.propertyType")}</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">{t("home.anyType")}</option>
              {propertyTypeKeys.map((k) => (
                <option key={k} value={k}>
                  {t(`types.${k}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={submit} className="btn-primary w-full lg:w-auto">
          <Search size={20} />
          {t("home.searchNow")}
        </button>
      </div>
    </div>
  );
}
