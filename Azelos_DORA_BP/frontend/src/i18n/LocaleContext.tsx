import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createTranslator, statusTranslationKey } from "./translate";
import en from "./translations/en";
import fr from "./translations/fr";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  type TranslationDict,
} from "./types";

const dictionaries: Record<Locale, TranslationDict> = { en, fr };

function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw === "fr" ? "fr" : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale === "fr" ? "fr" : "en";
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  translateStatus: (raw: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const l = readStoredLocale();
    applyDocumentLocale(l);
    return l;
  });

  const setLocale = useCallback((next: Locale) => {
    const resolved = next === "fr" ? "fr" : DEFAULT_LOCALE;
    setLocaleState(resolved);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, resolved);
    } catch {
      /* ignore */
    }
    applyDocumentLocale(resolved);
  }, []);

  const value = useMemo((): LocaleContextValue => {
    const dict = dictionaries[locale];
    const t = createTranslator(dict);
    return {
      locale,
      setLocale,
      t,
      translateStatus: (raw: string) => {
        const key = statusTranslationKey(raw);
        if (!key) return raw;
        const label = t(key);
        return label === key ? raw : label;
      },
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("LocaleProvider required");
  return ctx;
}
