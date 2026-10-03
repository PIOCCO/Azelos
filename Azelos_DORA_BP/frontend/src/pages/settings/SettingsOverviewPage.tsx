import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { useTranslation } from "../../i18n/LocaleContext";

const SECTION_KEYS = [
  { titleKey: "settings.sections.dora.title", descKey: "settings.sections.dora.description", to: "/settings/dora" },
  { titleKey: "settings.sections.access.title", descKey: "settings.sections.access.description", to: "/settings/access" },
  {
    titleKey: "settings.sections.integrations.title",
    descKey: "settings.sections.integrations.description",
    to: "/settings/integrations",
  },
  { titleKey: "settings.sections.cloud.title", descKey: "settings.sections.cloud.description", to: "/settings/cloud" },
  {
    titleKey: "settings.sections.customFields.title",
    descKey: "settings.sections.customFields.description",
    to: "/settings/custom-fields",
  },
] as const;

export function SettingsOverviewPage() {
  const { t, locale } = useTranslation();
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {locale === "fr" ? (
          <>
            L'identité de l'organisation et la classification réglementaire sont gérées dans{" "}
            <Link to="/organization/profile" className="text-primary underline">
              {t("settings.organizationProfileLink")}
            </Link>
            . Les événements d'audit opérationnels figurent dans{" "}
            <Link to="/audit-log" className="text-primary underline">
              {t("settings.auditLogLink")}
            </Link>
            .
          </>
        ) : (
          <>
            Organization identity and regulatory classification are managed under{" "}
            <Link to="/organization/profile" className="text-primary underline">
              {t("settings.organizationProfileLink")}
            </Link>
            . Operational audit events are under{" "}
            <Link to="/audit-log" className="text-primary underline">
              {t("settings.auditLogLink")}
            </Link>
            .
          </>
        )}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTION_KEYS.map((s) => (
          <Link key={s.to} to={s.to} className="block transition hover:opacity-90">
            <Card title={t(s.titleKey)}>
              <p className="text-sm text-gray-600">{t(s.descKey)}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary">{t("settings.openSection")}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
