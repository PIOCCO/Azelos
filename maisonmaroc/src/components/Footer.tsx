import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  const { t } = useLocale();
  return (
    <footer className="mt-auto border-t border-ink-100 bg-navy text-ink-200">
      <div className="container-page flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <BrandLogo variant="footer" linkToHome={false} />
          <p className="mt-4 text-sm leading-relaxed text-ink-400">{t("footer.about")}</p>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-white/90">
            {t("footer.quickLinks")}
          </h4>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-400">
            <li>
              <Link to="/search" className="hover:text-white">
                {t("nav.properties")}
              </Link>
            </li>
            <li>
              <Link to="/agents" className="hover:text-white">
                {t("nav.agents")}
              </Link>
            </li>
            <li>
              <Link to="/favorites" className="hover:text-white">
                {t("nav.favorites")}
              </Link>
            </li>
            <li>
              <Link to="/client/login" className="hover:text-white">
                {t("nav.login")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wide text-white/90">
            {t("footer.contactUs")}
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-400">
            <li className="flex items-center gap-2">
              <MapPin size={16} /> {t("footer.location")}
            </li>
            <li className="flex items-center gap-2" dir="ltr">
              <Mail size={16} /> contact@apio.ma
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} APIO — {t("footer.rights")}
      </div>
    </footer>
  );
}
