import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  CalendarDays,
  Building2,
  Languages,
} from "lucide-react";
import { ownerById, owners } from "../data/owners";
import { propertiesByOwner } from "../data/properties";
import { reviewsByOwner } from "../data/reviews";
import { cityById } from "../data/cities";
import { useLocale } from "../lib/useLocale";
import { formatDate } from "../lib/format";
import Avatar from "../components/Avatar";
import Stars from "../components/Stars";
import PropertyCard from "../components/PropertyCard";
import ContactModal from "../components/ContactModal";
import NotFoundPage from "./NotFoundPage";

export default function OwnerProfilePage() {
  const { id } = useParams();
  const { t, L, lang } = useLocale();
  const [contactOpen, setContactOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "sale" | "rent">("all");

  const owner = id ? ownerById(id) : undefined;
  if (!owner) return <NotFoundPage />;

  const listings = propertiesByOwner(owner.id);
  const reviews = reviewsByOwner(owner.id);
  const city = cityById(owner.cityId);
  const forSale = listings.filter((p) => p.transaction === "sale");
  const forRent = listings.filter((p) => p.transaction === "rent");
  const shown = tab === "sale" ? forSale : tab === "rent" ? forRent : listings;

  return (
    <div>
      {/* Cover + profile header */}
      <div className="bg-gradient-to-br from-brand-700 to-brand-900">
        <div className="container-page py-10">
          <div className="flex flex-col items-center gap-5 text-center text-white sm:flex-row sm:text-start rtl:sm:text-right">
            <Avatar
              src={owner.avatar}
              name={L(owner.name)}
              className="h-28 w-28 rounded-2xl ring-4 ring-white/20"
            />
            <div className="flex-1">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-extrabold sm:text-3xl">{L(owner.name)}</h1>
                {owner.verified && <BadgeCheck size={24} className="text-gold-400" />}
              </div>
              <p className="mt-1 text-brand-100">
                {owner.agency ? L(owner.agency) : t(`owner.${owner.type}`)}
                {owner.verified && ` · ${t("owner.verifiedAgent")}`}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-brand-100 sm:justify-start">
                <Stars rating={owner.rating} />
                <span>({owner.reviewsCount} {t("owner.reviews")})</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={15} /> {L(city?.name)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 size={15} /> {listings.length} {t("owner.properties")}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a href={`tel:${owner.phone}`} className="btn bg-white text-brand-700 hover:bg-brand-50">
                <Phone size={16} /> {t("owner.call")}
              </a>
              <a
                href={`https://wa.me/${owner.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
              >
                <MessageCircle size={16} /> {t("owner.whatsapp")}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[320px_1fr]">
        {/* Sidebar info */}
        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-ink-900">{t("owner.aboutTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{L(owner.bio)}</p>
            <ul className="mt-4 space-y-3 text-sm text-ink-600">
              <li className="flex items-center gap-2">
                <Clock size={16} className="text-brand-500" />
                {t("owner.responseTime")}: {owner.responseTimeMinutes} {t("owner.minutes")}
              </li>
              <li className="flex items-center gap-2">
                <CalendarDays size={16} className="text-brand-500" />
                {t("owner.memberSince")}: {formatDate(owner.memberSince, lang)}
              </li>
              <li className="flex items-center gap-2">
                <Languages size={16} className="text-brand-500" />
                {t("owner.languages")}: {owner.languages.map((l) => (l === "ar" ? "العربية" : "Français")).join(" · ")}
              </li>
              <li className="flex items-center gap-2" dir="ltr">
                <Phone size={16} className="text-brand-500" />
                {owner.phone}
              </li>
              <li className="flex items-center gap-2" dir="ltr">
                <Mail size={16} className="text-brand-500" />
                {owner.email}
              </li>
            </ul>
            <button onClick={() => setContactOpen(true)} className="btn-primary mt-4 w-full">
              <Mail size={16} /> {t("owner.contactAgent")}
            </button>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-ink-900">{t("owner.reviewsTitle")}</h3>
              <div className="mt-3 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-ink-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Avatar src={r.avatar} name={L(r.author)} className="h-8 w-8 rounded-full" />
                      <div>
                        <div className="text-sm font-semibold text-ink-800">{L(r.author)}</div>
                        <Stars rating={r.rating} size={12} showValue={false} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-ink-600">{L(r.text)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Listings */}
        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">
              {t("owner.ownerProperties")}
            </h2>
          </div>
          <div className="mb-5 inline-flex rounded-xl bg-ink-100 p-1">
            {[
              { v: "all", label: `${t("common.all")} (${listings.length})` },
              { v: "sale", label: `${t("owner.forSale")} (${forSale.length})` },
              { v: "rent", label: `${t("owner.forRent")} (${forRent.length})` },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setTab(o.v as typeof tab)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                  tab === o.v ? "bg-white text-brand-700 shadow-sm" : "text-ink-600"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {shown.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </div>

      {/* Other agents */}
      <div className="container-page pb-12">
        <h2 className="mb-5 text-xl font-bold text-ink-900">{t("home.verifiedOwners")}</h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {owners
            .filter((o) => o.id !== owner.id)
            .map((o) => (
              <Link
                key={o.id}
                to={`/agent/${o.id}`}
                className="card flex w-48 shrink-0 flex-col items-center p-4 text-center hover:shadow-card-hover"
              >
                <Avatar src={o.avatar} name={L(o.name)} className="h-14 w-14 rounded-full" />
                <span className="mt-2 line-clamp-1 text-sm font-bold text-ink-900">{L(o.name)}</span>
                <Stars rating={o.rating} size={12} className="mt-1" />
              </Link>
            ))}
        </div>
      </div>

      <ContactModal owner={owner} open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
