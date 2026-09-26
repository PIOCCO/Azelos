import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch, apiMediaUrl } from "../lib/api";
import { BadgeCheck, MapPin, CalendarDays, Building2, Languages } from "lucide-react";
import { useListings } from "../context/ListingsContext";
import { cityById } from "../data/cities";
import { useLocale } from "../lib/useLocale";
import { useContactAgent } from "../hooks/useContactAgent";
import Avatar from "../components/Avatar";
import PropertyCard from "../components/PropertyCard";
import AgentPropertyPicker from "../components/AgentPropertyPicker";
import NotFoundPage from "./NotFoundPage";

export default function OwnerProfilePage() {
  const { id } = useParams();
  const { t, L } = useLocale();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "sale" | "rent">("all");
  const contactAgent = useContactAgent();

  const { ownerById, propertiesByOwner } = useListings();
  const owner = id ? ownerById(id) : undefined;
  const [publicProfile, setPublicProfile] = useState<{ avatar?: string; bio?: { fr: string; ar: string } } | null>(
    null,
  );

  useEffect(() => {
    if (!id) return;
    apiFetch<{ profile: { avatar?: string; bio?: { fr: string; ar: string } } }>(
      `/api/public/member-profiles/${id}`,
    ).then(({ data }) => {
      if (data?.profile) setPublicProfile(data.profile);
    });
  }, [id]);

  if (!owner) return <NotFoundPage />;

  const displayAvatar = apiMediaUrl(publicProfile?.avatar) || owner.avatar;

  const listings = propertiesByOwner(owner.id);
  const city = cityById(owner.cityId);
  const forSale = listings.filter((p) => p.transaction === "sale");
  const forRent = listings.filter((p) => p.transaction === "rent");
  const shown = tab === "sale" ? forSale : tab === "rent" ? forRent : listings;
  const sinceYear = new Date(owner.memberSince).getFullYear();
  const experienceYears = Math.max(1, new Date().getFullYear() - sinceYear);

  return (
    <div className="bg-ink-50">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-page py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <Avatar src={displayAvatar} name={L(owner.name)} className="h-24 w-24 rounded-md" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-ink-900">{L(owner.name)}</h1>
                {owner.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                    <BadgeCheck size={16} /> {t("common.verified")}
                  </span>
                )}
              </div>
              <p className="mt-1 text-ink-600">
                {owner.agency ? L(owner.agency) : t(`owner.${owner.type}`)}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={15} /> {L(city?.name)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 size={15} /> {listings.length} {t("owner.properties")}
                </span>
                <span>
                  {t("agent.experience", { years: experienceYears })}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary shrink-0 rounded-md px-6"
              onClick={() => setPickerOpen(true)}
            >
              {t("agent.sendMessage")}
            </button>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="border border-ink-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-ink-900">{t("owner.aboutTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{L(owner.bio)}</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-600">
              <li className="flex items-center gap-2">
                <CalendarDays size={16} className="text-brand-600" />
                {t("agent.since", { year: sinceYear })}
              </li>
              <li className="flex items-center gap-2">
                <Languages size={16} className="text-brand-600" />
                {owner.languages.map((l) => (l === "ar" ? "العربية" : "Français")).join(" · ")}
              </li>
              <li>
                <span className="font-semibold text-ink-800">{t("agent.areas")}: </span>
                {L(city?.name)}
              </li>
            </ul>
          </div>
        </aside>

        <div>
          <h2 className="text-xl font-bold text-ink-900">{t("owner.ownerProperties")}</h2>
          <div className="mb-5 mt-3 inline-flex border border-ink-200 bg-white p-0.5">
            {[
              { v: "all", label: `${t("common.all")} (${listings.length})` },
              { v: "sale", label: `${t("owner.forSale")} (${forSale.length})` },
              { v: "rent", label: `${t("owner.forRent")} (${forRent.length})` },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setTab(o.v as typeof tab)}
                className={`px-4 py-1.5 text-sm font-semibold ${
                  tab === o.v ? "bg-brand-700 text-white" : "text-ink-600 hover:bg-ink-50"
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

      {pickerOpen && (
        <AgentPropertyPicker
          properties={listings}
          onClose={() => setPickerOpen(false)}
          onPick={(p) => {
            setPickerOpen(false);
            contactAgent(p);
          }}
        />
      )}
    </div>
  );
}
