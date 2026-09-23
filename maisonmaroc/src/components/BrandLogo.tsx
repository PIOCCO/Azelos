import { Link } from "react-router-dom";
import { useLocale } from "../lib/useLocale";
import { withBase } from "../lib/appBase";

type Variant = "header" | "footer" | "hero" | "auth" | "compact" | "onLight";

const wordmarkClass: Record<Variant, string> = {
  header: "text-xl font-black tracking-[0.28em] text-white sm:text-[1.35rem]",
  footer: "text-lg font-black tracking-[0.28em] text-white",
  hero: "text-3xl font-black tracking-[0.35em] text-white sm:text-4xl",
  auth: "text-2xl font-black tracking-[0.3em] text-white",
  compact: "text-base font-black tracking-[0.22em] text-white",
  onLight: "text-xl font-black tracking-[0.28em] text-brand-700",
};

const iconClass: Record<Variant, string> = {
  header: "h-9 w-9 sm:h-10 sm:w-10",
  footer: "h-9 w-9",
  hero: "h-10 w-10 sm:h-11 sm:w-11",
  auth: "h-11 w-11",
  compact: "h-8 w-8",
  onLight: "h-9 w-9",
};

const taglineTone: Record<Variant, string> = {
  header: "text-white/55",
  footer: "text-white/55",
  hero: "text-white/80",
  auth: "text-brand-100",
  compact: "text-white/55",
  onLight: "text-ink-500",
};

interface Props {
  variant?: Variant;
  showTagline?: boolean;
  linkToHome?: boolean;
  className?: string;
}

export default function BrandLogo({
  variant = "header",
  showTagline = true,
  linkToHome = true,
  className = "",
}: Props) {
  const { t } = useLocale();
  const taglineClass = `mt-1 block text-[10px] font-semibold sm:text-[11px] ${taglineTone[variant]}${
    variant === "hero" ? " text-xs sm:text-sm" : ""
  }`;

  const inner = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={withBase("/logo-mark.svg")}
        alt=""
        className={`shrink-0 ${iconClass[variant]}`}
      />
      <div className="leading-none">
        <span className={`block font-display ${wordmarkClass[variant]}`}>APIO</span>
        {showTagline && <span className={taglineClass}>{t("brand.tagline")}</span>}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="shrink-0 transition opacity-95 hover:opacity-100">
        {inner}
      </Link>
    );
  }
  return inner;
}
