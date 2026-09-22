import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Home,
  CalendarDays,
  BadgeCheck,
  Phone,
  MessageCircle,
  Check,
} from "lucide-react";
import { useListings } from "../context/ListingsContext";
import { cityById } from "../data/cities";
import { useLocale } from "../lib/useLocale";
import { formatPrice, formatNumber, formatDate } from "../lib/format";
import ImageGallery from "../components/ImageGallery";
import OwnerContactCard from "../components/OwnerContactCard";
import ContactModal from "../components/ContactModal";
import PropertyCard from "../components/PropertyCard";
import FavoriteButton from "../components/FavoriteButton";
import ShareButton from "../components/ShareButton";
import AmenityIcon from "../components/AmenityIcon";
import NotFoundPage from "./NotFoundPage";

export default function PropertyDetailsPage() {
  const { slug } = useParams();
  const { t, L, lang } = useLocale();
  const { propertyBySlug, properties, ownerById } = useListings();
  const [contactOpen, setContactOpen] = useState(false);
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
    <div className="container-page py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
        <Link to="/" className="hover:text-brand-700">{t("nav.home")}</Link>
        <span>/</span>
        <Link to={`/search?city=${property.cityId}`} className="hover:text-brand-700">
          {L(city?.name)}
        </Link>
        <span>/</span>
        <span className="line-clamp-1 text-ink-700">{L(property.title)}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div>
          <ImageGallery
            images={property.images}
            alt={L(property.title)}
            seed={property.id}
          />

          {/* Title block */}
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                    property.transaction === "sale" ? "bg-brand-600" : "bg-emerald-600"
                  }`}
                >
                  {property.transaction === "sale" ? t("property.forSale") : t("property.forRent")}
                </span>
                <span className="chip">{t(`types.${property.type}`)}</span>
                {property.verified && (
                  <span className="badge-verified">
                    <BadgeCheck size={13} /> {t("common.verified")}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-ink-900 sm:text-3xl">
                {L(property.title)}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-ink-500">
                <MapPin size={16} />
                {L(property.neighborhood)}، {L(city?.name)}
              </p>
            </div>
            <div className="text-end">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-brand-700 sm:text-3xl">
                  {formatPrice(property.price, lang)}
                </span>
                <span className="text-sm font-semibold text-ink-500">{t("common.mad")}</span>
              </div>
              {property.transaction === "rent" && (
                <span className="text-xs text-ink-400">{t("common.perMonth")}</span>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <ShareButton title={L(property.title)} />
                <FavoriteButton propertyId={property.id} />
              </div>
            </div>
          </div>

          {/* Key facts */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="card flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon size={20} />
                </span>
                <div>
                  <div className="text-sm font-bold text-ink-900">{f.value}</div>
                  <div className="text-xs text-ink-500">{f.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-ink-900">{t("property.description")}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-600">
              {L(property.description)}
            </p>
          </section>

          {/* Features */}
          {property.amenities.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-ink-900">{t("property.features")}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((a) => (
                  <div
                    key={a}
                    className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white px-3.5 py-3 text-sm font-medium text-ink-700"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <AmenityIcon amenity={a} size={16} />
                    </span>
                    {t(`amenities.${a}`)}
                  </div>
                ))}
                {property.furnished && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white px-3.5 py-3 text-sm font-medium text-ink-700">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Check size={16} />
                    </span>
                    {t("property.furnished")}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Meta */}
          <section className="mt-8 flex flex-wrap gap-x-8 gap-y-2 rounded-2xl bg-white p-5 text-sm shadow-card ring-1 ring-ink-100">
            <span className="flex items-center gap-2 text-ink-600">
              <CalendarDays size={16} className="text-ink-400" />
              {t("property.publishedOn")}: {formatDate(property.publishedDate, lang)}
            </span>
            <span className="flex items-center gap-2 text-ink-600">
              <Home size={16} className="text-ink-400" />
              {t("property.reference")}: {property.id.toUpperCase()}
            </span>
          </section>

          {/* Map */}
          <section className="mt-8">
            <h2 className="text-xl font-bold text-ink-900">{t("property.location")}</h2>
            <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-ink-100">
              <iframe
                title="map"
                src={mapSrc}
                className="h-72 w-full border-0"
                loading="lazy"
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="lg:sticky lg:top-20">
            {owner && (
              <OwnerContactCard
                owner={owner}
                property={property}
                onContact={() => setContactOpen(true)}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-extrabold text-ink-900">
            {t("property.similar")}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile contact bar */}
      {owner && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink-100 bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <a href={`tel:${owner.phone}`} className="btn-outline flex-1">
              <Phone size={16} /> {t("owner.call")}
            </a>
            <a
              href={`https://wa.me/${owner.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-whatsapp flex-1"
            >
              <MessageCircle size={16} /> {t("owner.whatsapp")}
            </a>
            <button onClick={() => setContactOpen(true)} className="btn-primary flex-1">
              {t("owner.contact")}
            </button>
          </div>
        </div>
      )}

      {owner && (
        <ContactModal
          owner={owner}
          property={property}
          open={contactOpen}
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  );
}
