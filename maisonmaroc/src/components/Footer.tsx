import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import BrandLogo from "./BrandLogo";
import { INSTITUTION } from "../config/institution";

export default function Footer() {
  const { t, L } = useLocale();
  const navLinks = [
    { to: "/", label: t("inst.nav.home") },
    { to: "/a-propos", label: t("inst.nav.about") },
    { to: "/membres", label: t("inst.nav.members") },
    { to: "/projets", label: t("inst.nav.projects") },
    { to: "/actualites", label: t("inst.nav.news") },
    { to: "/evenements", label: t("inst.nav.events") },
    { to: "/documents", label: t("inst.nav.documents") },
    { to: "/contact", label: t("inst.nav.contact") },
  ];
  const legalLinks = [
    { to: "/legal/mentions-legales", label: t("inst.legal.mentions") },
    { to: "/legal/confidentialite", label: t("inst.legal.privacy") },
    { to: "/legal/cookies", label: t("inst.legal.cookies") },
    { to: "/legal/cgu", label: t("inst.legal.terms") },
  ];

  return (
    <footer className="mt-auto border-t border-ink-100 bg-navy text-ink-200">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo variant="footer" linkToHome={false} />
          <p className="mt-3 text-sm font-semibold text-white">{L(INSTITUTION.name)}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">{L(INSTITUTION.tagline)}</p>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-white/90">
            {t("footer.quickLinks")}
          </h4>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-400">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-white/90">
            {t("inst.footer.legal")}
          </h4>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-400">
            {legalLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-white/90">
            {t("footer.contactUs")}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-400">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> {L(INSTITUTION.address)}
            </li>
            <li className="flex items-center gap-2" dir="ltr">
              <Mail size={16} /> {INSTITUTION.email}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> {INSTITUTION.phone}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} {INSTITUTION.shortName.fr} — {t("footer.rights")}
      </div>
    </footer>
  );
}
