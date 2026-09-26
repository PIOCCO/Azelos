import { Link } from "react-router-dom";
import { useLocale } from "../../lib/useLocale";
import type { ProfileCompletion } from "../../lib/ownerPortalTypes";

const missingLinks: Record<string, string> = {
  avatar: "/owner/profile#public",
  bio: "/owner/profile#public",
  phone: "/owner/profile#public",
  email: "/owner/profile#public",
  account: "/owner/settings",
};

export default function ProfileCompletionBar({ completion }: { completion: ProfileCompletion }) {
  const { t, lang } = useLocale();
  const label = (item: { labelFr: string; labelAr: string }) => (lang === "fr" ? item.labelFr : item.labelAr);

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-navy">{t("ownerPortal.profileCompletion")}</h2>
        <span className="text-sm font-semibold text-brand-700">{completion.percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${completion.percent}%` }} />
      </div>
      {completion.missing.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-ink-600">
          {completion.missing.map((m) => (
            <li key={m.key}>
              <Link to={missingLinks[m.key] || "/owner/profile"} className="font-medium text-brand-700 hover:underline">
                {t("ownerPortal.missingItem", { item: label(m) })}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
