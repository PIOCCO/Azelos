import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Users, MapPinned, Smile, PlusCircle } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import OwnerCard from "../components/OwnerCard";
import SmartImage from "../components/SmartImage";
import { useListings } from "../context/ListingsContext";
import { owners } from "../data/owners";
import { cities } from "../data/cities";

function SectionHeader({
  title,
  subtitle,
  to,
  cta,
}: {
  title: string;
  subtitle: string;
  to?: string;
  cta?: string;
}) {
  const { isRTL } = useLocale();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
      </div>
      {to && cta && (
        <Link
          to={to}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:inline-flex"
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
  const featured = properties.filter((p) => p.featured).slice(0, 6);
  const latest = [...properties]
    .sort(
      (a, b) =>
        new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
    )
    .slice(0, 8);
  const topOwners = [...owners]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const stats = [
    { icon: Building2, value: `${properties.length}+`, label: t("home.statsProperties") },
    { icon: Users, value: `${owners.length}+`, label: t("home.statsAgents") },
    { icon: MapPinned, value: `${cities.length}`, label: t("home.statsCities") },
    { icon: Smile, value: "2 500+", label: t("home.statsClients") },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <SmartImage
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920&q=70"
            fallbackSeed="mm-hero"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/70 to-ink-950/85" />
        </div>
        <div className="container-page relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center text-white">
            <span className="chip bg-white/15 text-white ring-1 ring-white/20">
              🇲🇦 {t("brand.tagline")}
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-5xl">
              {t("home.heroTitle")} <span className="text-gold-400">✨</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-100 sm:text-lg">
              {t("home.heroSubtitle")}
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-ink-100 bg-white">
        <div className="container-page grid grid-cols-2 gap-4 py-8 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon size={22} />
              </span>
              <div>
                <div className="text-xl font-extrabold text-ink-900">{value}</div>
                <div className="text-xs text-ink-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-12">
        <SectionHeader
          title={t("home.featured")}
          subtitle={t("home.featuredSub")}
          to="/search"
          cta={t("common.viewAll")}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* Popular cities */}
      <section className="bg-white py-12">
        <div className="container-page">
          <SectionHeader
            title={t("home.popularCities")}
            subtitle={t("home.popularCitiesSub")}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {cities.map((c) => {
              const count = properties.filter((p) => p.cityId === c.id).length;
              return (
                <Link
                  key={c.id}
                  to={`/search?city=${c.id}`}
                  className="group relative overflow-hidden rounded-2xl shadow-card"
                >
                  <SmartImage
                    src={c.image}
                    fallbackSeed={`city-${c.id}`}
                    alt={L(c.name)}
                    className="h-32 w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <div className="font-bold">{L(c.name)}</div>
                    <div className="text-[11px] text-white/80">
                      {count} {t("home.propertiesCount")}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verified owners */}
      <section className="container-page py-12">
        <SectionHeader
          title={t("home.verifiedOwners")}
          subtitle={t("home.verifiedOwnersSub")}
          to="/agents"
          cta={t("common.viewAll")}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {topOwners.map((o) => (
            <OwnerCard key={o.id} owner={o} />
          ))}
        </div>
      </section>

      {/* Latest */}
      <section className="bg-white py-12">
        <div className="container-page">
          <SectionHeader
            title={t("home.latest")}
            subtitle={t("home.latestSub")}
            to="/search"
            cta={t("common.viewAll")}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-12">
        <div className="relative overflow-hidden rounded-3xl bg-brand-700 px-6 py-12 text-center text-white sm:px-12">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl">{t("home.ctaTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">{t("home.ctaSub")}</p>
            <Link
              to="/publish"
              className="btn mt-6 bg-white text-brand-700 hover:bg-brand-50"
            >
              <PlusCircle size={18} /> {t("home.ctaButton")}
            </Link>
          </div>
          <div className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -start-10 h-56 w-56 rounded-full bg-white/10" />
        </div>
      </section>
    </div>
  );
}
