import { useLocale } from "../lib/useLocale";

export default function SkipLink() {
  const { t } = useLocale();
  return (
    <a href="#main-content" className="skip-link">
      {t("inst.a11y.skipToContent")}
    </a>
  );
}
