import { Link } from "react-router-dom";
import { BedDouble, Bath, Maximize, MapPin, BadgeCheck } from "lucide-react";
import type { Property } from "../data/types";
import { cityById } from "../data/cities";
import { useListings } from "../context/ListingsContext";
import { useLocale } from "../lib/useLocale";
import { formatPrice, formatNumber } from "../lib/format";
import SmartImage from "./SmartImage";
import Avatar from "./Avatar";
import FavoriteButton from "./FavoriteButton";

interface Props {
  property: Property;
  layout?: "grid" | "list";
  variant?: "default" | "compact";
}

export default function PropertyCard({
  property,
  layout = "grid",
  variant = "default",
}: Props) {
  const { t, L, lang } = useLocale();
  const { ownerById } = useListings();
  const city = cityById(property.cityId);
  const owner = ownerById(property.ownerId);
  const isList = layout === "list";
  const compact = variant === "compact";

  return (
    <Link
      to={`/property/${property.slug}`}
      className={`group overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-card ${
        isList ? "flex flex-col sm:flex-row" : "flex flex-col"
      }`}
    >
      <div
        className={`relative overflow-hidden ${isList ? "sm:w-64 sm:shrink-0" : ""}`}
      >
        <SmartImage
          src={property.images[0]}
          fallbackSeed={property.id}
          alt={L(property.title)}
          className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
            isList ? "h-48 sm:h-full" : compact ? "h-44" : "h-52"
          }`}
        />
        <div className="absolute start-3 top-3">
          <FavoriteButton propertyId={property.id} className="shadow-md" />
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
          <div className="flex items-baseline gap-1 text-white">
            <span className="text-lg font-extrabold">
              {formatPrice(property.price, lang)}
            </span>
            <span className="text-xs font-bold opacity-90">{t("common.mad")}</span>
            {property.transaction === "rent" && (
              <span className="text-[10px] opacity-80">{t("common.perMonth")}</span>
            )}
          </div>
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-4"}`}>
        <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-ink-900 group-hover:text-brand-700 sm:text-base">
          {L(property.title)}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
          <MapPin size={13} className="shrink-0 text-brand-500" />
          <span className="line-clamp-1">
            {L(property.neighborhood)} · {L(city?.name)}
          </span>
        </p>

        <div className="mt-2.5 flex items-center gap-3 text-xs font-semibold text-ink-600">
          {property.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <BedDouble size={14} className="text-ink-400" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1">
              <Bath size={14} className="text-ink-400" />
              {property.bathrooms}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Maximize size={14} className="text-ink-400" />
            {formatNumber(property.surface, lang)} {t("common.sar")}
          </span>
        </div>

        {owner && (
          <div className="mt-auto flex items-center gap-2 border-t border-ink-100 pt-2.5">
            <Avatar
              src={owner.avatar}
              name={L(owner.name)}
              className="h-6 w-6 rounded-full ring-1 ring-ink-100"
            />
            <span className="line-clamp-1 text-xs font-bold text-ink-700">
              {L(owner.name)}
            </span>
            {owner.verified && (
              <BadgeCheck size={13} className="shrink-0 text-brand-500" />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
