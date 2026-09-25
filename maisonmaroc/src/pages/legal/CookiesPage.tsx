import LegalDocument from "../../components/LegalDocument";
import { cookiesSections } from "../../config/legalTexts";
import { useLocale } from "../../lib/useLocale";

export default function CookiesPage() {
  const { t } = useLocale();
  return (
    <LegalDocument
      title={t("inst.legal.cookies")}
      metaDescription={t("inst.legal.cookiesMeta")}
      path="/legal/cookies"
      sections={cookiesSections}
    />
  );
}
