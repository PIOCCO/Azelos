import { Link } from "react-router-dom";
import { useLocale } from "../lib/useLocale";
import PageMeta from "../components/PageMeta";

export default function ForbiddenPage() {
  const { t } = useLocale();
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
      <PageMeta title="403" description={t("inst.errors.forbidden")} />
      <span className="font-display text-7xl font-extrabold text-ink-400">403</span>
      <p className="max-w-md text-lg font-semibold text-ink-700">{t("inst.errors.forbidden")}</p>
      <Link to="/" className="btn-primary">
        {t("common.backHome")}
      </Link>
    </div>
  );
}
