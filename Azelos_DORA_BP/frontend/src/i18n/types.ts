export type Locale = "en" | "fr";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "dora.locale";

/** Nested translation tree (interface avoids TS2456 circular alias on Record). */
export interface TranslationDict {
  [key: string]: string | TranslationDict;
}
