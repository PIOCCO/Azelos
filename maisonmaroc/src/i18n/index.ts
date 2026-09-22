import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ar } from "./ar";
import { fr } from "./fr";

export type Lang = "ar" | "fr";

const STORAGE_KEY = "mm.lang";

export const getInitialLang = (): Lang => {
  const saved = (typeof localStorage !== "undefined" &&
    localStorage.getItem(STORAGE_KEY)) as Lang | null;
  return saved === "fr" ? "fr" : "ar";
};

export const applyLangToDocument = (lang: Lang) => {
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
};

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    fr: { translation: fr },
  },
  lng: getInitialLang(),
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  const lang: Lang = lng === "fr" ? "fr" : "ar";
  localStorage.setItem(STORAGE_KEY, lang);
  applyLangToDocument(lang);
});

applyLangToDocument(getInitialLang());

export default i18n;
