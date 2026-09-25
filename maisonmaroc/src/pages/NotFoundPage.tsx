import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { useLocale } from "../lib/useLocale";
import PageMeta from "../components/PageMeta";

export default function NotFoundPage() {
  const { t } = useLocale();
  return (
    <div className="page-shell">
      <PageMeta title={t("inst.errors.notFound")} description={t("inst.errors.notFoundHint")} />
      <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="font-display text-7xl font-extrabold text-brand-600">404</span>
        <p className="text-lg font-semibold text-ink-700">{t("inst.errors.notFound")}</p>
        <p className="max-w-md text-sm text-ink-600">{t("inst.errors.notFoundHint")}</p>
        <Link to="/" className="btn-primary mt-2">
          <Home size={16} aria-hidden /> {t("common.backHome")}
        </Link>
      </div>
    </div>
  );
}
