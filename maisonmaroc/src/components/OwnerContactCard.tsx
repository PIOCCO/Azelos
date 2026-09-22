import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Owner, Property } from "../data/types";
import { useListings } from "../context/ListingsContext";
import { useLocale } from "../lib/useLocale";
import { formatDate } from "../lib/format";
import Avatar from "./Avatar";
import Stars from "./Stars";

interface Props {
  owner: Owner;
  property?: Property;
  onContact: () => void;
}

export default function OwnerContactCard({ owner, property, onContact }: Props) {
  const { t, L, lang, isRTL } = useLocale();
  const { propertiesByOwner } = useListings();
  const count = propertiesByOwner(owner.id).length;
  const waText = encodeURIComponent(
    property ? `${t("contact.prefill")}\n\n"${L(property.title)}"` : t("contact.prefill"),
  );
  const Arrow = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white">
        <div className="flex items-center gap-3">
          <Avatar
            src={owner.avatar}
            name={L(owner.name)}
            className="h-16 w-16 rounded-full ring-4 ring-white/20"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-lg font-bold">{L(owner.name)}</h3>
              {owner.verified && <BadgeCheck size={18} className="shrink-0 text-gold-400" />}
            </div>
            <p className="truncate text-sm text-brand-100">
              {owner.agency ? L(owner.agency) : t(`owner.${owner.type}`)}
            </p>
            <div className="mt-1">
              <Stars rating={owner.rating} size={14} />
              <span className="ms-1 text-xs text-brand-100">
                ({owner.reviewsCount} {t("owner.reviews")})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100 text-center rtl:divide-x-reverse">
        <div className="p-3">
          <Building2 size={16} className="mx-auto text-brand-500" />
          <div className="mt-1 text-sm font-bold text-ink-900">{count}</div>
          <div className="text-[10px] text-ink-500">{t("owner.properties")}</div>
        </div>
        <div className="p-3">
          <Clock size={16} className="mx-auto text-brand-500" />
          <div className="mt-1 text-sm font-bold text-ink-900">
            {owner.responseTimeMinutes} {t("owner.minutes")}
          </div>
          <div className="text-[10px] text-ink-500">{t("owner.responseTime")}</div>
        </div>
        <div className="p-3">
          <CalendarDays size={16} className="mx-auto text-brand-500" />
          <div className="mt-1 text-sm font-bold text-ink-900">
            {new Date(owner.memberSince).getFullYear()}
          </div>
          <div className="text-[10px] text-ink-500">{t("owner.memberSince")}</div>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <a href={`tel:${owner.phone}`} className="btn-primary w-full">
          <Phone size={16} /> {t("owner.call")}
        </a>
        <a
          href={`https://wa.me/${owner.whatsapp}?text=${waText}`}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp w-full"
        >
          <MessageCircle size={16} /> {t("owner.whatsapp")}
        </a>
        <button onClick={onContact} className="btn-outline w-full">
          <Mail size={16} /> {t("owner.contact")}
        </button>
        <Link to={`/agent/${owner.id}`} className="btn-ghost w-full">
          {t("owner.viewProfile")} <Arrow size={16} />
        </Link>
      </div>

      <div className="border-t border-ink-100 p-4 text-xs text-ink-500">
        {t("owner.memberSince")}: {formatDate(owner.memberSince, lang)}
      </div>
    </div>
  );
}
