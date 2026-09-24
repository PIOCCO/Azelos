import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "../lib/useLocale";

interface Props {
  title: string;
  subtitle?: string;
  to?: string;
  cta?: string;
}

export default function SectionHeader({ title, subtitle, to, cta }: Props) {
  const { isRTL } = useLocale();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {to && cta && (
        <Link to={to} className="btn-ghost px-2 py-1.5 text-brand-700">
          {cta} <Arrow size={16} />
        </Link>
      )}
    </div>
  );
}
