import { Link } from "react-router-dom";
import { useLocale } from "../lib/useLocale";
import PageMeta from "../components/PageMeta";

export default function TooManyRequestsPage() {
  const { t } = useLocale();
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
      <PageMeta title="429" description={t("inst.errors.rateLimit")} />
      <span className="font-display text-7xl font-extrabold text-ink-400">429</span>
      <p className="max-w-md text-lg font-semibold text-ink-700">{t("inst.errors.rateLimit")}</p>
      <p className="max-w-md text-sm text-ink-600">{t("inst.errors.rateLimitHint")}</p>
      <Link to="/" className="btn-primary">
        {t("common.backHome")}
      </Link>
    </div>
  );
}
