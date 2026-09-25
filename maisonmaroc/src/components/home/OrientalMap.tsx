import { useLocale } from "../../lib/useLocale";
import { cities } from "../../data/cities";

/** Simplified Morocco silhouette — Oriental (eastern) region highlighted in APIO blue. */
const ORIENTAL_PATH =
  "M118 42 L168 38 L185 55 L192 78 L188 105 L175 128 L165 155 L158 178 L150 200 L142 218 L128 235 L115 248 L105 230 L98 205 L92 175 L88 145 L85 115 L88 85 L95 62 L105 48 Z";

const MOROCCO_OUTLINE =
  "M28 95 L45 72 L62 55 L82 42 L105 38 L128 40 L148 48 L168 38 L185 55 L192 78 L188 105 L182 130 L175 155 L168 180 L158 205 L148 228 L135 248 L118 262 L98 268 L78 262 L58 248 L42 228 L32 205 L25 178 L22 150 L24 120 L28 95 Z";

/** Normalized positions (0–200 x, 0–280 y) for main Oriental cities */
const CITY_MARKERS: { id: string; x: number; y: number }[] = [
  { id: "oujda", x: 152, y: 118 },
  { id: "nador", x: 168, y: 88 },
  { id: "berkane", x: 142, y: 132 },
  { id: "taourirt", x: 138, y: 148 },
  { id: "saidia", x: 162, y: 72 },
  { id: "jerada", x: 128, y: 165 },
];

interface Props {
  className?: string;
}

export default function OrientalMap({ className = "" }: Props) {
  const { L } = useLocale();

  return (
    <div className={`relative bg-[#eef2f8] ${className}`}>
      <svg
        viewBox="0 0 200 280"
        className="mx-auto h-auto w-full max-w-md"
        role="img"
        aria-label={L({ fr: "Carte — région de l'Oriental", ar: "خريطة — جهة الشرقية" })}
      >
        <path d={MOROCCO_OUTLINE} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
        <path d={ORIENTAL_PATH} fill="#1d4ed8" fillOpacity="0.85" stroke="#1e3a8a" strokeWidth="1.2" />
        {CITY_MARKERS.map(({ id, x, y }) => {
          const city = cities.find((c) => c.id === id);
          if (!city) return null;
          return (
            <g key={id}>
              <circle cx={x} cy={y} r="4" fill="#fff" stroke="#1e40af" strokeWidth="1.5" />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                className="fill-ink-700 text-[7px] font-semibold"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {L(city.name)}
              </text>
            </g>
          );
        })}
        <text x="145" y="200" textAnchor="middle" className="fill-white text-[9px] font-bold opacity-90">
          Oriental
        </text>
      </svg>
    </div>
  );
}
