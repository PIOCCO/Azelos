import { Link } from "react-router-dom";
import { Heart, Search } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useFavorites } from "../context/FavoritesContext";
import { properties } from "../data/properties";
import PropertyCard from "../components/PropertyCard";

export default function FavoritesPage() {
  const { t } = useLocale();
  const { favorites } = useFavorites();
  const saved = properties.filter((p) => favorites.includes(p.id));

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
          <Heart size={24} className="fill-rose-500" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{t("favorites.title")}</h1>
          <p className="text-sm text-ink-500">{t("favorites.subtitle")}</p>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Heart size={48} className="text-ink-300" />
          <p className="text-lg font-bold text-ink-800">{t("favorites.empty")}</p>
          <p className="max-w-sm text-sm text-ink-500">{t("favorites.emptyHint")}</p>
          <Link to="/search" className="btn-primary mt-2">
            <Search size={16} /> {t("favorites.browse")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
