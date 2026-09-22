import { Globe } from "lucide-react";
import { useLocale } from "../lib/useLocale";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, changeLang } = useLocale();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white p-0.5 text-sm">
      {!compact && <Globe size={16} className="mx-1 text-ink-400" />}
      <button
        type="button"
        onClick={() => changeLang("ar")}
        className={`rounded-full px-3 py-1 font-semibold transition ${
          lang === "ar" ? "bg-brand-600 text-white" : "text-ink-600 hover:text-ink-900"
        }`}
      >
        العربية
      </button>
      <button
        type="button"
        onClick={() => changeLang("fr")}
        className={`rounded-full px-3 py-1 font-semibold transition ${
          lang === "fr" ? "bg-brand-600 text-white" : "text-ink-600 hover:text-ink-900"
        }`}
      >
        Français
      </button>
    </div>
  );
}
