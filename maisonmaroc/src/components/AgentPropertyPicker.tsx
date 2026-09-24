import { useLocale } from "../lib/useLocale";
import type { Property } from "../data/types";
import { formatPrice } from "../lib/format";
import SmartImage from "./SmartImage";

export default function AgentPropertyPicker({
  properties,
  onPick,
  onClose,
}: {
  properties: Property[];
  onPick: (p: Property) => void;
  onClose: () => void;
}) {
  const { t, L, lang } = useLocale();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg">
        <div className="border-b border-ink-100 px-4 py-3">
          <h2 className="font-bold text-ink-900">{t("agent.pickProperty")}</h2>
          <p className="text-xs text-ink-500">{t("agent.pickPropertyHint")}</p>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto divide-y divide-ink-100">
          {properties.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full gap-3 p-3 text-start hover:bg-ink-50"
                onClick={() => onPick(p)}
              >
                <SmartImage
                  src={p.images[0]}
                  fallbackSeed={p.id}
                  alt=""
                  className="h-14 w-16 rounded object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-ink-900">{L(p.title)}</div>
                  <div className="text-xs text-brand-700">
                    {formatPrice(p.price, lang)} {t("common.mad")}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-ink-100 p-3 text-end">
          <button type="button" className="btn-secondary text-sm" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
