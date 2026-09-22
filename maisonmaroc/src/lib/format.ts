import type { Lang } from "../i18n";

export const formatPrice = (value: number, lang: Lang): string => {
  const locale = lang === "ar" ? "ar-MA" : "fr-MA";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number, lang: Lang): string => {
  const locale = lang === "ar" ? "ar-MA" : "fr-MA";
  return new Intl.NumberFormat(locale).format(value);
};

export const formatDate = (iso: string, lang: Lang): string => {
  const locale = lang === "ar" ? "ar-MA" : "fr-MA";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
};

export const relativeDate = (iso: string, lang: Lang): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.max(0, Math.round(diffMs / 86400000));
  const rtf = new Intl.RelativeTimeFormat(lang === "ar" ? "ar" : "fr", {
    numeric: "auto",
  });
  if (days < 1) return lang === "ar" ? "اليوم" : "aujourd'hui";
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.round(days / 30);
  return rtf.format(-months, "month");
};
