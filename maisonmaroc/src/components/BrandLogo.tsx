import { Link } from "react-router-dom";
import { useLocale } from "../lib/useLocale";
import { withBase } from "../lib/appBase";

/** Single official APIO brand mark (full logo with icon and wordmark). */
export const OFFICIAL_LOGO_PATH = "/apio-logo.png";

type Variant = "header" | "footer" | "hero" | "auth" | "compact" | "onLight";

/** Height-led sizing; width follows asset aspect ratio (~1408×768). */
const sizeClass: Record<Variant, string> = {
  header: "h-9 w-auto max-w-[min(200px,42vw)] sm:h-10 sm:max-w-[220px]",
  footer: "h-12 w-auto max-w-[240px]",
  hero: "h-16 w-auto max-w-[min(320px,85vw)] sm:h-20 md:h-24",
  auth: "h-14 w-auto max-w-[280px]",
  compact: "h-8 w-auto max-w-[180px]",
  onLight: "h-10 w-auto max-w-[220px] sm:h-11",
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
      src={withBase(OFFICIAL_LOGO_PATH)}
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
