import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../lib/useLocale";

const STORAGE_KEY = "apio.cookieConsent";

export default function CookieConsent() {
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white p-4 shadow-lg lg:bottom-auto lg:left-4 lg:right-auto lg:top-auto lg:max-w-md lg:rounded-xl lg:border lg:bottom-4"
      role="dialog"
      aria-labelledby="cookie-banner-title"
    >
      <p id="cookie-banner-title" className="text-sm font-bold text-ink-900">
        {t("inst.cookies.bannerTitle")}
      </p>
      <p className="mt-2 text-sm text-ink-600">{t("inst.cookies.bannerBody")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "essential");
            setVisible(false);
          }}
        >
          {t("inst.cookies.acceptEssential")}
        </button>
        <Link to="/legal/cookies" className="btn-outline btn-sm" onClick={() => setVisible(false)}>
          {t("inst.cookies.learnMore")}
        </Link>
      </div>
    </div>
  );
}
