import { useTranslation } from "../../i18n/LocaleContext";
import type { Locale } from "../../i18n/types";
import { Card } from "../../components/ui/Card";

export function SettingsLanguagePage() {
  const { locale, setLocale, t } = useTranslation();

  const options: { value: Locale; labelKey: string }[] = [
    { value: "en", labelKey: "settings.languageEnglish" },
    { value: "fr", labelKey: "settings.languageFrench" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{t("settings.general")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("settings.languageHelp")}</p>
      </div>
      <Card title={t("settings.language")}>
        <fieldset className="space-y-3">
          <legend className="sr-only">{t("settings.language")}</legend>
          {options.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name="locale"
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                checked={locale === opt.value}
                onChange={() => setLocale(opt.value)}
              />
              <span className="font-medium text-gray-900">{t(opt.labelKey)}</span>
            </label>
          ))}
        </fieldset>
      </Card>
    </div>
  );
}
