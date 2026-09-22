import { Link } from "react-router-dom";
import { BadgeCheck, Building2, MapPin } from "lucide-react";
import type { Owner } from "../data/types";
import { useListings } from "../context/ListingsContext";
import { cityById } from "../data/cities";
import { useLocale } from "../lib/useLocale";
import Avatar from "./Avatar";
import Stars from "./Stars";

export default function OwnerCard({ owner }: { owner: Owner }) {
  const { t, L } = useLocale();
  const { propertiesByOwner } = useListings();
  const count = propertiesByOwner(owner.id).length;
  const city = cityById(owner.cityId);

  return (
    <Link
      to={`/agent/${owner.id}`}
      className="group flex flex-col items-center rounded-xl border border-ink-100 bg-white p-5 text-center shadow-sm transition hover:border-brand-200 hover:shadow-card"
    >
      <div className="relative">
        <Avatar
          src={owner.avatar}
          name={L(owner.name)}
          className="h-[72px] w-[72px] rounded-full ring-2 ring-ink-100"
        />
        {owner.verified && (
          <span className="absolute -bottom-0.5 -end-0.5 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white ring-2 ring-white">
            <BadgeCheck size={14} />
          </span>
        )}
      </div>
      <h3 className="mt-3 text-sm font-extrabold text-ink-900 group-hover:text-brand-700">
        {L(owner.name)}
      </h3>
      <p className="text-xs font-medium text-ink-500">
        {owner.agency ? L(owner.agency) : t(`owner.${owner.type}`)}
      </p>
      <Stars rating={owner.rating} className="mt-2" size={12} />
      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-ink-500">
        <span className="inline-flex items-center gap-1">
          <Building2 size={13} /> {count}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin size={13} /> {L(city?.name)}
        </span>
      </div>
    </Link>
  );
}
