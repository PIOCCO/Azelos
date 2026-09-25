import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { useLocale } from "../lib/useLocale";

export default function NotFoundPage() {
  const { t } = useLocale();
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="font-display text-7xl font-extrabold text-brand-600">404</span>
      <p className="text-lg font-semibold text-ink-700">{t("inst.errors.notFound")}</p>
      <Link to="/" className="btn-primary mt-2">
        <Home size={16} /> {t("common.backHome")}
      </Link>
    </div>
  );
}
