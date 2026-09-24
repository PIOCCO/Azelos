import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { cities } from "../data/cities";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  const { t, L } = useLocale();
  return (
    <footer className="mt-16 border-t border-ink-100 bg-navy text-ink-200">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo variant="footer" linkToHome={false} />
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            {t("footer.about")}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-white">{t("footer.quickLinks")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-400">
            <li><Link to="/search" className="hover:text-white">{t("nav.properties")}</Link></li>
            <li><Link to="/agents" className="hover:text-white">{t("nav.agents")}</Link></li>
            <li><Link to="/favorites" className="hover:text-white">{t("nav.favorites")}</Link></li>
            <li><Link to="/client/messages" className="hover:text-white">{t("nav.messages")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white">{t("footer.cities")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-400">
            {cities.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to={`/search?city=${c.id}`} className="hover:text-white">
                  {L(c.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white">{t("footer.contactUs")}</h4>
          <ul className="mt-4 space-y-3 text-sm text-ink-400">
            <li className="flex items-center gap-2">
              <MapPin size={16} /> {L({ ar: "وجدة، المغرب", fr: "Oujda, Maroc" })}
            </li>
            <li className="flex items-center gap-2" dir="ltr">
              <Mail size={16} /> contact@apio.ma
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-ink-500">
        © {new Date().getFullYear()}{" "}
        <span className="font-black tracking-widest text-white/90">APIO</span> — {t("footer.rights")}
      </div>
    </footer>
  );
}
