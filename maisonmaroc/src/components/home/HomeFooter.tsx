import { Link } from "react-router-dom";
import { useLocale } from "../../lib/useLocale";
import { INSTITUTION } from "../../config/institution";
import BrandLogo from "../BrandLogo";
import LanguageSwitcher from "../LanguageSwitcher";
import { safeExternalHref } from "../../lib/safeUrl";

export default function HomeFooter() {
  const { t, L } = useLocale();

  const columns = [
    {
      title: t("homePage.footer.explore"),
      links: [
        { to: "/a-propos", label: t("homePage.nav.about") },
        { to: "/membres", label: t("homePage.nav.members") },
        { to: "/projets", label: t("homePage.nav.projects") },
        { to: "/actualites", label: t("homePage.nav.news") },
      ],
    },
    {
      title: t("homePage.footer.resources"),
      links: [
        { to: "/evenements", label: t("homePage.nav.events") },
        { to: "/documents", label: t("homePage.nav.documents") },
        { to: "/faq", label: t("homePage.footer.faq") },
        { to: "/contact", label: t("homePage.nav.contact") },
      ],
    },
    {
      title: t("homePage.footer.legal"),
      links: [
        { to: "/legal/mentions-legales", label: t("homePage.footer.mentions") },
        { to: "/legal/confidentialite", label: t("homePage.footer.privacy") },
        { to: "/legal/cookies", label: t("homePage.footer.cookies") },
        { to: "/legal/cgu", label: t("homePage.footer.terms") },
      ],
    },
  ];

  const socials = [
    { key: "facebook" as const, label: "Facebook" },
    { key: "linkedin" as const, label: "LinkedIn" },
    { key: "youtube" as const, label: "YouTube" },
  ].filter((s) => INSTITUTION.social[s.key]);

  return (
    <footer className="home-footer">
      <div className="home-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BrandLogo variant="footer" linkToHome={false} />
          <p className="mt-4 max-w-sm font-serif text-lg text-white/95">{L(INSTITUTION.name)}</p>
          <p className="mt-2 text-sm text-white/60">{L(INSTITUTION.tagline)}</p>
          <div className="mt-4 text-sm text-white/70">
            <p>{L(INSTITUTION.address)}</p>
            <p className="mt-1" dir="ltr">
              {INSTITUTION.email}
            </p>
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/80 transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="home-container flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {INSTITUTION.shortName.fr}. {t("footer.rights")}
          </p>
          <div className="flex items-center gap-4">
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
