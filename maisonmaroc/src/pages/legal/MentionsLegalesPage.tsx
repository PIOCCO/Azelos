import LegalDocument from "../../components/LegalDocument";
import { mentionsLegalesSections } from "../../config/legalTexts";
import { useLocale } from "../../lib/useLocale";

export default function MentionsLegalesPage() {
  const { t } = useLocale();
  return (
    <LegalDocument
      title={t("inst.legal.mentions")}
      metaDescription={t("inst.legal.mentionsMeta")}
      path="/legal/mentions-legales"
      sections={mentionsLegalesSections}
    />
  );
}
