import LegalDocument from "../../components/LegalDocument";
import { privacySections } from "../../config/legalTexts";
import { useLocale } from "../../lib/useLocale";

export default function PrivacyPage() {
  const { t } = useLocale();
  return (
    <LegalDocument
      title={t("inst.legal.privacy")}
      metaDescription={t("inst.legal.privacyMeta")}
      path="/legal/confidentialite"
      sections={privacySections}
    />
  );
}
