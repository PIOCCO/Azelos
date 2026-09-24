import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Home,
  CalendarDays,
  BadgeCheck,
  Check,
} from "lucide-react";
import { useListings } from "../context/ListingsContext";
import { cityById } from "../data/cities";
import { useLocale } from "../lib/useLocale";
import { formatPrice, formatNumber, formatDate } from "../lib/format";
import { useContactAgent } from "../hooks/useContactAgent";
import ImageGallery from "../components/ImageGallery";
import AgentSidebarCard from "../components/AgentSidebarCard";
import PropertyCard from "../components/PropertyCard";
import FavoriteButton from "../components/FavoriteButton";
import AmenityIcon from "../components/AmenityIcon";
import NotFoundPage from "./NotFoundPage";

export default function PropertyDetailsPage() {
  const { slug } = useParams();
  const { t, L, lang } = useLocale();
  const { propertyBySlug, properties, ownerById } = useListings();
  const contactAgent = useContactAgent();
  const property = slug ? propertyBySlug(slug) : undefined;

  if (!property) return <NotFoundPage />;

  const owner = ownerById(property.ownerId);
  const city = cityById(property.cityId);
  const similar = properties
    .filter(
      (p) =>
        p.id !== property.id &&
        (p.cityId === property.cityId || p.type === property.type),
    )
    .slice(0, 3);

  const facts = [
    { icon: Maximize, label: t("property.surface"), value: `${formatNumber(property.surface, lang)} ${t("common.sar")}` },
    ...(property.bedrooms > 0
      ? [{ icon: BedDouble, label: t("property.bedrooms"), value: String(property.bedrooms) }]
      : []),
    ...(property.bathrooms > 0
      ? [{ icon: Bath, label: t("property.bathrooms"), value: String(property.bathrooms) }]
      : []),
    { icon: Home, label: t("property.type"), value: t(`types.${property.type}`) },
  ];

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${
    property.lng - 0.02
  }%2C${property.lat - 0.02}%2C${property.lng + 0.02}%2C${
    property.lat + 0.02
  }&layer=mapnik&marker=${property.lat}%2C${property.lng}`;

  return (
    <div className="bg-ink-50">
      <div className="container-page py-6 pb-24 lg:pb-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
          <Link to="/" className="hover:text-brand-700">{t("nav.home")}</Link>
          <span>/</span>
          <Link to={`/search?city=${property.cityId}`} className="hover:text-brand-700">
            {L(city?.name)}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 text-ink-700">{L(property.title)}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <ImageGallery images={property.images} alt={L(property.title)} seed={property.id} />

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 pb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {property.transaction === "sale" ? t("property.forSale") : t("property.forRent")}
                  </span>
                  {property.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                      <BadgeCheck size={13} /> {t("common.verified")}
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">{L(property.title)}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-ink-600">
                  <MapPin size={16} />
                  {L(property.neighborhood)}، {L(city?.name)}
                </p>
              </div>
              <div className="text-end">
                <div className="text-2xl font-bold text-ink-900 sm:text-3xl">
                  {formatPrice(property.price, lang)}{" "}
                  <span className="text-base font-semibold text-ink-500">{t("common.mad")}</span>
                </div>
                {property.transaction === "rent" && (
                  <span className="text-xs text-ink-500">{t("common.perMonth")}</span>
                )}
                <div className="mt-2 flex justify-end">
                  <FavoriteButton propertyId={property.id} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="border border-ink-100 bg-white p-3">
                  <div className="text-sm font-bold text-ink-900">{f.value}</div>
                  <div className="text-xs text-ink-500">{f.label}</div>
                </div>
              ))}
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink-900">{t("property.description")}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-600">
                {L(property.description)}
              </p>
            </section>

            {property.amenities.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold text-ink-900">{t("property.features")}</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {property.amenities.map((a) => (
                    <div
                      key={a}
                      className="flex items-center gap-2 border border-ink-100 bg-white px-3 py-2 text-sm text-ink-700"
                    >
                      <AmenityIcon amenity={a} size={16} />
                      {t(`amenities.${a}`)}
                    </div>
                  ))}
                  {property.furnished && (
                    <div className="flex items-center gap-2 border border-ink-100 bg-white px-3 py-2 text-sm">
                      <Check size={16} /> {t("property.furnished")}
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="mt-8 flex flex-wrap gap-6 border border-ink-100 bg-white p-4 text-sm text-ink-600">
              <span className="flex items-center gap-2">
                <CalendarDays size={16} />
                {t("property.publishedOn")}: {formatDate(property.publishedDate, lang)}
              </span>
              <span className="flex items-center gap-2">
                <Home size={16} />
                {t("property.reference")}: {property.id.toUpperCase()}
              </span>
              <span>{t("property.available")}</span>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-bold text-ink-900">{t("property.location")}</h2>
              <div className="mt-3 overflow-hidden border border-ink-200">
                <iframe title="map" src={mapSrc} className="h-72 w-full border-0" loading="lazy" />
              </div>
            </section>
          </div>

          <aside>
            <div className="lg:sticky lg:top-[118px]">
              {owner && (
                <AgentSidebarCard
                  owner={owner}
                  property={property}
                  onContact={() => contactAgent(property)}
                />
              )}
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-xl font-bold text-ink-900">{t("property.similar")}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}

        {owner && (
          <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink-200 bg-white p-3 lg:hidden">
            <button
              type="button"
              onClick={() => contactAgent(property)}
              className="btn-primary w-full rounded-md py-3"
            >
              {t("agent.contactAgent")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
