import { useTranslation } from "react-i18next";
import type { Bilingual } from "../data/types";
import type { Lang } from "../i18n";

/**
 * Convenience hook: returns the active language, the `t` function, a direction
 * flag, and `L()` to resolve a bilingual field to the current language.
 */
export function useLocale() {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language === "fr" ? "fr" : "ar";
  const isRTL = lang === "ar";
  const L = (field: Bilingual | undefined) => (field ? field[lang] : "");
  const changeLang = (next: Lang) => i18n.changeLanguage(next);
  return { t, lang, isRTL, L, changeLang };
}
