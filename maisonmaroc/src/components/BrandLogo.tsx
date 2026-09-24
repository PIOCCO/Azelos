import { Link } from "react-router-dom";
import { useLocale } from "../lib/useLocale";
import { withBase } from "../lib/appBase";

/** Official mark at `public/public/apio-logo.png` → URL `/public/apio-logo.png`. */
export const OFFICIAL_LOGO_PATH = "/public/apio-logo.png";

function logoSrc(): string {
  return withBase(OFFICIAL_LOGO_PATH);
}

type Variant = "header" | "footer" | "hero" | "auth" | "compact" | "onLight";

/** Height-led sizing; width follows asset aspect ratio (~1408×768). */
const sizeClass: Record<Variant, string> = {
  header: "h-12 w-auto max-w-[min(300px,55vw)] sm:h-14 sm:max-w-[340px]",
  footer: "h-16 w-auto max-w-[320px] sm:h-[4.5rem] sm:max-w-[360px]",
  hero: "h-24 w-auto max-w-[min(420px,92vw)] sm:h-28 md:h-32 lg:max-w-[480px]",
  auth: "h-20 w-auto max-w-[360px] sm:h-24 sm:max-w-[420px]",
  compact: "h-11 w-auto max-w-[260px] sm:h-12",
  onLight: "h-14 w-auto max-w-[320px] sm:h-16 sm:max-w-[360px]",
};

interface Props {
  variant?: Variant;
  /** @deprecated Logo image includes full branding; ignored. */
  showTagline?: boolean;
  linkToHome?: boolean;
  className?: string;
}

export default function BrandLogo({
  variant = "header",
  linkToHome = true,
  className = "",
}: Props) {
  const { t } = useLocale();

  const img = (
    <img
      src={logoSrc()}
      alt={t("brand.name")}
      className={`block shrink-0 object-contain object-left ${sizeClass[variant]} ${className}`}
      width={1408}
      height={768}
      decoding="async"
    />
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-block shrink-0 transition opacity-95 hover:opacity-100">
        {img}
      </Link>
    );
  }
  return img;
}
