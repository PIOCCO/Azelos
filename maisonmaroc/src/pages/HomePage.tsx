import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import OwnerCard from "../components/OwnerCard";
import SmartImage from "../components/SmartImage";
import { useListings } from "../context/ListingsContext";
import { owners } from "../data/owners";
import { cities } from "../data/cities";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1518548419970-58e985b0a4a2?auto=format&fit=crop&w=1920&q=80";

function SectionHeader({
  title,
  subtitle,
  to,
  cta,
}: {
  title: string;
  subtitle?: string;
  to?: string;
  cta?: string;
}) {
  const { isRTL } = useLocale();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-ink-100 pb-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {to && cta && (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700"
        >
          {cta} <Arrow size={16} />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const { t, L } = useLocale();
  const { properties } = useListings();
  const featured = properties.filter((p) => p.featured).slice(0, 4);
  const latest = [...properties]
    .sort(
      (a, b) =>
        new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
    )
    .slice(0, 8);
  const topOwners = [...owners]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  return (
    <div className="bg-white">
      {/* Hero — mockup: architecture bg + headline + search */}
      <section className="relative min-h-[480px] sm:min-h-[540px]">
        <div className="absolute inset-0 overflow-hidden">
          <SmartImage
            src={HERO_IMAGE}
            fallbackSeed="mm-hero-morocco"
            alt=""
            className="h-full w-full scale-105 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/75 via-navy/55 to-navy/85" />
        </div>
        <div className="container-page relative flex flex-col items-center pt-10 pb-28 text-center sm:pt-14 sm:pb-32">
          <h1 className="max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-[2.75rem]">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            {t("home.heroSubtitle")}
          </p>
          <div className="mt-8 w-full max-w-[980px] text-start">
            <SearchBar hero />
          </div>
        </div>
      </section>

      {/* Featured — 4 cards row */}
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

      {/* Popular cities — text-forward tiles */}
      <section className="border-y border-ink-100 bg-ink-50 py-10 sm:py-12">
        <div className="container-page">
          <SectionHeader title={t("home.popularCities")} subtitle={t("home.popularCitiesSub")} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cities.map((c) => {
              const count = properties.filter((p) => p.cityId === c.id).length;
              return (
                <Link
                  key={c.id}
                  to={`/search?city=${c.id}`}
                  className="group flex flex-col items-center rounded-xl border border-ink-200 bg-white px-3 py-5 text-center shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                    <MapPin size={18} />
                  </span>
                  <span className="font-extrabold text-ink-900 group-hover:text-brand-700">
                    {L(c.name)}
                  </span>
                  <span className="mt-0.5 text-[11px] font-medium text-ink-400">
                    {c.name.fr}
                  </span>
                  <span className="mt-2 text-xs font-bold text-brand-600">
                    {count} {t("home.propertiesCount")}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verified owners */}
      <section className="container-page py-10 sm:py-12">
        <SectionHeader
          title={t("home.verifiedOwners")}
          subtitle={t("home.verifiedOwnersSub")}
          to="/agents"
          cta={t("common.viewAll")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topOwners.map((o) => (
            <OwnerCard key={o.id} owner={o} />
          ))}
        </div>
      </section>

      {/* Latest properties */}
      <section className="border-t border-ink-100 bg-ink-50 py-10 sm:py-12">
        <div className="container-page">
          <SectionHeader
            title={t("home.latest")}
            subtitle={t("home.latestSub")}
            to="/search"
            cta={t("common.viewAll")}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((p) => (
              <PropertyCard key={p.id} property={p} variant="compact" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
