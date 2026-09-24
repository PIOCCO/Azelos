import { Link } from "react-router-dom";
import { BadgeCheck, Building2, CalendarDays } from "lucide-react";
import type { Owner, Property } from "../data/types";
import { useListings } from "../context/ListingsContext";
import { useLocale } from "../lib/useLocale";
import Avatar from "./Avatar";

interface Props {
  owner: Owner;
  property: Property;
  onContact: () => void;
}

export default function AgentSidebarCard({ owner, onContact }: Props) {
  const { t, L } = useLocale();
  const { propertiesByOwner } = useListings();
  const count = propertiesByOwner(owner.id).length;
  const sinceYear = new Date(owner.memberSince).getFullYear();
  const experienceYears = Math.max(1, new Date().getFullYear() - sinceYear);

  return (
    <div className="border border-ink-200 bg-white shadow-sm">
      <div className="border-b border-ink-100 bg-ink-50/80 p-5">
        <div className="flex items-center gap-4">
          <Avatar src={owner.avatar} name={L(owner.name)} className="h-16 w-16 rounded-md" />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-bold text-ink-900">{L(owner.name)}</h3>
              {owner.verified && <BadgeCheck size={18} className="text-brand-600" />}
            </div>
            <p className="text-sm text-ink-600">
              {owner.agency ? L(owner.agency) : t(`owner.${owner.type}`)}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              {t("agent.experience", { years: experienceYears })} · {count}{" "}
              {t("owner.properties")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <p className="text-sm leading-relaxed text-ink-600 line-clamp-4">{L(owner.bio)}</p>
        <button type="button" onClick={onContact} className="btn-primary w-full rounded-md py-3">
          {t("agent.contactAgent")}
        </button>
        <Link
          to={`/agent/${owner.id}`}
          className="block text-center text-sm font-semibold text-brand-700 hover:underline"
        >
          {t("owner.viewProfile")}
        </Link>
      </div>

      <div className="flex border-t border-ink-100 text-center text-xs text-ink-500">
        <div className="flex flex-1 items-center justify-center gap-1.5 py-3">
          <Building2 size={14} /> {count} {t("owner.properties")}
        </div>
        <div className="flex flex-1 items-center justify-center gap-1.5 border-s border-ink-100 py-3">
          <CalendarDays size={14} /> {t("agent.since", { year: sinceYear })}
        </div>
      </div>
    </div>
  );
}
