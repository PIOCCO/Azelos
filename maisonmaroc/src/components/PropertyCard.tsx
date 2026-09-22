import { Link } from "react-router-dom";
import { BedDouble, Bath, Maximize, MapPin, BadgeCheck } from "lucide-react";
import type { Property } from "../data/types";
import { cityById } from "../data/cities";
import { ownerById } from "../data/owners";
import { useLocale } from "../lib/useLocale";
import { formatPrice, formatNumber } from "../lib/format";
import SmartImage from "./SmartImage";
import Avatar from "./Avatar";
import FavoriteButton from "./FavoriteButton";
import ShareButton from "./ShareButton";

interface Props {
  property: Property;
  layout?: "grid" | "list";
}

export default function PropertyCard({ property, layout = "grid" }: Props) {
  const { t, L, lang } = useLocale();
  const city = cityById(property.cityId);
  const owner = ownerById(property.ownerId);
  const isList = layout === "list";

  const priceLabel = (
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-extrabold text-brand-700">
        {formatPrice(property.price, lang)}
      </span>
      <span className="text-xs font-semibold text-ink-500">{t("common.mad")}</span>
      {property.transaction === "rent" && (
        <span className="text-xs text-ink-400">{t("common.perMonth")}</span>
      )}
    </div>
  );

  return (
    <Link
      to={`/property/${property.slug}`}
      className={`group card overflow-hidden transition-all duration-200 hover:shadow-card-hover ${
        isList ? "flex flex-col sm:flex-row" : "flex flex-col"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          isList ? "sm:w-72 sm:shrink-0" : ""
        }`}
      >
        <SmartImage
          src={property.images[0]}
          fallbackSeed={property.id}
          alt={L(property.title)}
          className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
            isList ? "h-52 sm:h-full" : "h-56"
          }`}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-col gap-1.5">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm ${
                property.transaction === "sale" ? "bg-brand-600" : "bg-emerald-600"
              }`}
            >
              {property.transaction === "sale"
                ? t("property.forSale")
                : t("property.forRent")}
            </span>
            {property.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
                <BadgeCheck size={12} /> {t("common.verified")}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            <ShareButton title={L(property.title)} />
            <FavoriteButton propertyId={property.id} />
          </div>
        </div>
        <span className="absolute bottom-0 start-0 m-3 chip bg-black/55 text-white backdrop-blur">
          {t(`types.${property.type}`)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {priceLabel}
        <h3 className="mt-1 line-clamp-1 text-base font-bold text-ink-900 group-hover:text-brand-700">
          {L(property.title)}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
          <MapPin size={14} className="shrink-0" />
          <span className="line-clamp-1">
            {L(property.neighborhood)}، {L(city?.name)}
          </span>
        </p>

        <div className="mt-3 flex items-center gap-4 border-t border-ink-100 pt-3 text-sm text-ink-600">
          {property.bedrooms > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble size={16} className="text-ink-400" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Bath size={16} className="text-ink-400" />
              {property.bathrooms}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Maximize size={16} className="text-ink-400" />
            {formatNumber(property.surface, lang)} {t("common.sar")}
          </span>
        </div>

        {owner && (
          <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
            <Avatar
              src={owner.avatar}
              name={L(owner.name)}
              className="h-7 w-7 rounded-full ring-1 ring-ink-100"
            />
            <span className="line-clamp-1 text-xs font-medium text-ink-600">
              {L(owner.name)}
            </span>
            {owner.verified && (
              <BadgeCheck size={14} className="text-brand-500" />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
