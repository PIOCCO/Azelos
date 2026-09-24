import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import SmartImage from "../components/SmartImage";
import SectionHeader from "../components/SectionHeader";
import { useListings } from "../context/ListingsContext";
import { cities } from "../data/cities";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1518548419970-58e985b0a4a2?auto=format&fit=crop&w=1920&q=80";

export default function HomePage() {
  const { t, L } = useLocale();
  const { properties } = useListings();
  const featured = properties.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="bg-white">
      <section className="relative min-h-[520px] sm:min-h-[600px]">
        <div className="absolute inset-0">
          <SmartImage
            src={HERO_IMAGE}
            fallbackSeed="mm-hero-morocco"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/75 via-navy/55 to-navy/85" />
        </div>
        <div className="container-page relative flex flex-col items-center pt-10 pb-[calc(7rem+100px)] text-center sm:pt-14 sm:pb-[calc(8rem+120px)]">
          <h1 className="max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-[2.75rem]">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            {t("home.heroSubtitle")}
          </p>
          <div className="mt-8 w-full max-w-[720px] text-start">
            <SearchBar hero />
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-12">
        <SectionHeader
          title={t("home.featured")}
          subtitle={t("home.featuredSub")}
          to="/search"
          cta={t("common.viewAll")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} variant="compact" />
          ))}
        </div>
      </section>

      <section className="border-t border-ink-100 bg-surface py-10 sm:py-12">
        <div className="container-page">
          <SectionHeader
            title={t("home.popularCities")}
            subtitle={t("home.popularCitiesSub")}
          />
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {cities.map((c) => {
              const count = properties.filter((p) => p.cityId === c.id).length;
              return (
                <Link
                  key={c.id}
                  to={`/search?city=${c.id}`}
                  className="flex min-w-[140px] shrink-0 flex-col rounded-xl border border-ink-200 bg-white px-4 py-3 transition hover:border-brand-300 hover:shadow-sm"
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-900">
                    <MapPin size={14} className="text-brand-600" />
                    {L(c.name)}
                  </span>
                  <span className="mt-1 text-xs text-ink-500">
                    {count} {t("home.propertiesCount")}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <Link to="/search" className="btn-primary">
              {t("nav.properties")}
            </Link>
            <Link to="/agents" className="btn-outline">
              {t("nav.agents")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
