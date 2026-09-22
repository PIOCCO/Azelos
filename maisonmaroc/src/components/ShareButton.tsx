import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { useLocale } from "../lib/useLocale";

interface Props {
  title: string;
  className?: string;
  size?: number;
}

export default function ShareButton({ title, className = "", size = 18 }: Props) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      title={copied ? t("property.linkCopied") : t("property.share")}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-700 shadow-sm ring-1 ring-ink-100 backdrop-blur transition hover:scale-105 hover:text-brand-600 ${className}`}
    >
      {copied ? <Check size={size} className="text-emerald-600" /> : <Share2 size={size} />}
    </button>
  );
}
