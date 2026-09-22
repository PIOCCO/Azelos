import { Link } from "react-router-dom";
import { BadgeCheck, Building2, MapPin } from "lucide-react";
import type { Owner } from "../data/types";
import { propertiesByOwner } from "../data/properties";
import { cityById } from "../data/cities";
import { useLocale } from "../lib/useLocale";
import Avatar from "./Avatar";
import Stars from "./Stars";

export default function OwnerCard({ owner }: { owner: Owner }) {
  const { t, L } = useLocale();
  const count = propertiesByOwner(owner.id).length;
  const city = cityById(owner.cityId);

  return (
    <Link
      to={`/agent/${owner.id}`}
      className="group card flex flex-col items-center p-6 text-center transition hover:shadow-card-hover"
    >
      <div className="relative">
        <Avatar
          src={owner.avatar}
          name={L(owner.name)}
          className="h-20 w-20 rounded-full ring-4 ring-brand-50"
        />
        {owner.verified && (
          <span className="absolute -bottom-1 -end-1 grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white ring-2 ring-white">
            <BadgeCheck size={16} />
          </span>
        )}
      </div>
      <h3 className="mt-3 font-bold text-ink-900 group-hover:text-brand-700">
        {L(owner.name)}
      </h3>
      <p className="text-xs font-medium text-ink-500">
        {owner.agency ? L(owner.agency) : t(`owner.${owner.type}`)}
      </p>
      <Stars rating={owner.rating} className="mt-2" />
      <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1">
          <Building2 size={14} /> {count} {t("owner.properties")}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin size={14} /> {L(city?.name)}
        </span>
      </div>
    </Link>
  );
}
