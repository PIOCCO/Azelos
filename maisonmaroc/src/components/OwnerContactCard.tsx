import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Building2,
  CalendarDays,
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
  const { t, L, lang } = useLocale();
  const { propertiesByOwner } = useListings();
  const count = propertiesByOwner(owner.id).length;
  const waText = encodeURIComponent(
    property ? `${t("contact.prefill")}\n\n"${L(property.title)}"` : t("contact.prefill"),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
      <div className="border-b border-ink-100 bg-ink-50 p-5 text-center">
        <div className="relative mx-auto w-fit">
          <Avatar
            src={owner.avatar}
            name={L(owner.name)}
            className="mx-auto h-20 w-20 rounded-full ring-4 ring-white shadow-md"
          />
          {owner.verified && (
            <span className="absolute -bottom-1 -end-1 grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white ring-2 ring-white">
              <BadgeCheck size={16} />
            </span>
          )}
        </div>
        <h3 className="mt-3 text-lg font-extrabold text-ink-900">{L(owner.name)}</h3>
        <p className="text-sm font-medium text-ink-500">
          {owner.verified ? t("owner.verifiedAgent") : t(`owner.${owner.type}`)}
        </p>
        <div className="mt-2 flex items-center justify-center gap-1">
          <Stars rating={owner.rating} size={14} />
          <span className="text-xs font-semibold text-ink-500">
            ({owner.reviewsCount})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-ink-100 border-b border-ink-100 text-center rtl:divide-x-reverse">
        <div className="p-2.5">
          <Building2 size={15} className="mx-auto text-brand-500" />
          <div className="mt-0.5 text-sm font-extrabold text-ink-900">{count}</div>
          <div className="text-[9px] font-semibold text-ink-500">{t("owner.properties")}</div>
        </div>
        <div className="p-2.5">
          <Clock size={15} className="mx-auto text-brand-500" />
          <div className="mt-0.5 text-sm font-extrabold text-ink-900">
            {owner.responseTimeMinutes}m
          </div>
          <div className="text-[9px] font-semibold text-ink-500">{t("owner.responseTime")}</div>
        </div>
        <div className="p-2.5">
          <CalendarDays size={15} className="mx-auto text-brand-500" />
          <div className="mt-0.5 text-sm font-extrabold text-ink-900">
            {new Date(owner.memberSince).getFullYear()}
          </div>
          <div className="text-[9px] font-semibold text-ink-500">{t("owner.memberSince")}</div>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <a href={`tel:${owner.phone}`} className="btn-primary w-full rounded-lg py-3">
          <Phone size={16} /> {t("owner.call")}
        </a>
        <button
          type="button"
          onClick={onContact}
          className="btn w-full rounded-lg border-2 border-brand-600 bg-white py-3 text-brand-700 hover:bg-brand-50"
        >
          <Mail size={16} /> {t("owner.contact")}
        </button>
        <a
          href={`https://wa.me/${owner.whatsapp}?text=${waText}`}
          target="_blank"
          rel="noreferrer"
          className="btn-whatsapp w-full rounded-lg py-3"
        >
          <MessageCircle size={16} /> {t("owner.whatsapp")}
        </a>
        <Link
          to={`/agent/${owner.id}`}
          className="block pt-1 text-center text-sm font-bold text-brand-600 hover:underline"
        >
          {t("owner.viewProfile")}
        </Link>
      </div>

      <div className="border-t border-ink-100 px-4 py-3 text-center text-[11px] text-ink-400">
        {t("owner.memberSince")}: {formatDate(owner.memberSince, lang)}
      </div>
    </div>
  );
}
