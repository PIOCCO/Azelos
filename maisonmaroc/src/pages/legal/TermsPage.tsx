import LegalDocument from "../../components/LegalDocument";
import { termsSections } from "../../config/legalTexts";
import { useLocale } from "../../lib/useLocale";

export default function TermsPage() {
  const { t } = useLocale();
  return (
    <LegalDocument
      title={t("inst.legal.terms")}
      metaDescription={t("inst.legal.termsMeta")}
      path="/legal/cgu"
      sections={termsSections}
    />
  );
}
