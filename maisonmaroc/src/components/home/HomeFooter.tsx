import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useLocale } from "../../lib/useLocale";
import { INSTITUTION } from "../../config/institution";
import BrandLogo from "../BrandLogo";
import LanguageSwitcher from "../LanguageSwitcher";
import { safeExternalHref } from "../../lib/safeUrl";
import {
  FOOTER_LEGAL_LINKS,
  FOOTER_MAIN_NAV,
  FOOTER_RESOURCE_LINKS,
} from "../../config/footerNav";

function FooterColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-white/80 transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomeFooter() {
  const { t, L } = useLocale();

  const mainNav = FOOTER_MAIN_NAV.map((l) => ({ to: l.to, label: t(l.labelKey) }));
  const resources = FOOTER_RESOURCE_LINKS.map((l) => ({ to: l.to, label: t(l.labelKey) }));
  const legal = FOOTER_LEGAL_LINKS.map((l) => ({ to: l.to, label: t(l.labelKey) }));

  const socials = [
    { key: "facebook" as const, label: "Facebook" },
    { key: "linkedin" as const, label: "LinkedIn" },
    { key: "youtube" as const, label: "YouTube" },
  ].filter((s) => INSTITUTION.social[s.key]);

  return (
    <footer className="home-footer">
      <div className="home-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2">
          <BrandLogo variant="footer" linkToHome={false} />
          <p className="mt-4 font-serif text-lg leading-snug text-white/95">{L(INSTITUTION.name)}</p>
          <p className="mt-2 text-sm text-white/55">{L(INSTITUTION.tagline)}</p>
        </div>

        <FooterColumn title={t("homePage.footer.navigation")} links={mainNav} />
        <FooterColumn title={t("homePage.footer.resources")} links={resources} />
        <FooterColumn title={t("homePage.footer.legalInfo")} links={legal} />

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">
            {t("homePage.footer.contact")}
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/80">
            <li>
              <Link to="/contact" className="transition hover:text-white">
                {t("homePage.nav.contact")}
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${INSTITUTION.email}`}
                className="inline-flex items-center gap-2 transition hover:text-white"
                dir="ltr"
              >
                <Mail size={14} className="shrink-0 opacity-70" aria-hidden />
                {INSTITUTION.email}
              </a>
            </li>
            <li className="leading-relaxed text-white/70">{L(INSTITUTION.address)}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="home-container flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {t("homePage.footer.copyright")}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {socials.length > 0 && (
              <div className="flex gap-3">
                {socials.map((s) => {
                  const href = safeExternalHref(INSTITUTION.social[s.key]);
                  if (!href) return null;
                  return (
                    <a
                      key={s.key}
                      href={href}
                      className="text-xs text-white/70 hover:text-white"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {s.label}
                    </a>
                  );
                })}
              </div>
            )}
            <LanguageSwitcher variant="dark" />
          </div>
        </div>
      </div>
    </footer>
  );
}
