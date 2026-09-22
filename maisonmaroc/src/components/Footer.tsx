import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import { cities } from "../data/cities";

export default function Footer() {
  const { t, L } = useLocale();
  return (
    <footer className="mt-16 border-t border-ink-100 bg-ink-950 text-ink-200">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-9 w-9" />
            <span className="font-display text-lg font-extrabold text-white">
              {t("brand.name")}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            {t("footer.about")}
          </p>
          <div className="mt-5 flex gap-2">
            {[Facebook, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand-600"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white">{t("footer.quickLinks")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-400">
            <li><Link to="/search" className="hover:text-white">{t("nav.properties")}</Link></li>
            <li><Link to="/agents" className="hover:text-white">{t("nav.agents")}</Link></li>
            <li><Link to="/favorites" className="hover:text-white">{t("nav.favorites")}</Link></li>
            <li><Link to="/publish" className="hover:text-white">{t("nav.publish")}</Link></li>
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
              <MapPin size={16} /> {L({ ar: "الدار البيضاء، المغرب", fr: "Casablanca, Maroc" })}
            </li>
            <li className="flex items-center gap-2" dir="ltr">
              <Phone size={16} /> +212 5 22 00 00 00
            </li>
            <li className="flex items-center gap-2" dir="ltr">
              <Mail size={16} /> contact@maisonmaroc.ma
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} {t("brand.name")} — {t("footer.rights")}
      </div>
    </footer>
  );
}
