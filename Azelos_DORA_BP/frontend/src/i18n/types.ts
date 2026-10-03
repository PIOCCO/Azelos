export type Locale = "en" | "fr";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "dora.locale";

export type TranslationDict = Record<string, string | TranslationDict>;
