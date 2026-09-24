import { Link } from "react-router-dom";
import { Heart, Search } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { useFavorites } from "../context/FavoritesContext";
import { useListings } from "../context/ListingsContext";
import PropertyCard from "../components/PropertyCard";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

export default function FavoritesPage() {
  const { t } = useLocale();
  const { favorites } = useFavorites();
  const { properties } = useListings();
  const saved = properties.filter((p) => favorites.includes(p.id));

  return (
    <div className="page-shell">
      <div className="container-page">
        <PageHeader title={t("favorites.title")} description={t("favorites.subtitle")} />

        {saved.length === 0 ? (
          <EmptyState
            icon={<Heart size={48} className="text-ink-300" />}
            title={t("favorites.empty")}
            description={t("favorites.emptyHint")}
            action={
              <Link to="/search" className="btn-primary">
                <Search size={16} /> {t("favorites.browse")}
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <PropertyCard key={p.id} property={p} variant="compact" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
