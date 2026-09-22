import { useLocale } from "../lib/useLocale";

/** Mockup style: `Français | العربية` text toggle */
export default function LanguageSwitcher({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const { lang, changeLang } = useLocale();
  const inactive =
    variant === "dark" ? "text-white/55 hover:text-white" : "text-ink-500 hover:text-ink-800";
  const active = variant === "dark" ? "text-white font-bold" : "text-brand-700 font-bold";
  const sep = variant === "dark" ? "text-white/30" : "text-ink-300";

  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <button
        type="button"
        onClick={() => changeLang("fr")}
        className={lang === "fr" ? active : inactive}
      >
        Français
      </button>
      <span className={sep}>|</span>
      <button
        type="button"
        onClick={() => changeLang("ar")}
        className={lang === "ar" ? active : inactive}
      >
        العربية
      </button>
    </div>
  );
}
