import { useLocale } from "../../lib/useLocale";
import { cities } from "../../data/cities";

const NAVY = "#1a2332";
const MAP_BEIGE = "#e5dfd6";
const MAP_STROKE = "#c9c0b4";

/** Morocco silhouette (simplified, north-up). */
const MOROCCO_OUTLINE =
  "M22 78 L38 52 L58 38 L82 32 L108 34 L132 38 L158 36 L178 42 L198 58 L208 88 L210 118 L206 152 L198 188 L182 222 L162 252 L138 268 L108 274 L78 268 L52 252 L34 228 L24 198 L18 165 L16 132 L18 102 Z";

/** Oriental region — north-east of Morocco. */
const ORIENTAL_PATH =
  "M118 38 L162 36 L188 44 L204 68 L208 102 L200 138 L188 172 L172 208 L152 238 L128 248 L112 228 L104 188 L100 148 L104 108 L112 72 Z";

type Marker = {
  id: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
};

/** Oriental cities — labels sit to the left of the map, like the reference layout. */
const ORIENTAL_MARKERS: Marker[] = [
  { id: "saidia", x: 178, y: 58, labelX: 8, labelY: 54 },
  { id: "nador", x: 192, y: 72, labelX: 8, labelY: 72 },
  { id: "oujda", x: 168, y: 108, labelX: 8, labelY: 104 },
  { id: "berkane", x: 152, y: 128, labelX: 8, labelY: 124 },
  { id: "ahfir", x: 142, y: 142, labelX: 8, labelY: 140 },
  { id: "taourirt", x: 138, y: 158, labelX: 8, labelY: 156 },
  { id: "jerada", x: 122, y: 178, labelX: 8, labelY: 176 },
  { id: "guercif", x: 128, y: 198, labelX: 8, labelY: 196 },
  { id: "figuig", x: 148, y: 228, labelX: 8, labelY: 226 },
];

/** Decorative pins elsewhere in Morocco (no labels). */
const OTHER_PINS: { x: number; y: number }[] = [
  { x: 42, y: 72 },
  { x: 58, y: 118 },
  { x: 72, y: 148 },
  { x: 88, y: 108 },
  { x: 48, y: 188 },
  { x: 62, y: 218 },
  { x: 98, y: 238 },
];

function Pin({ cx, cy, filled = true }: { cx: number; cy: number; filled?: boolean }) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <path
        d="M0 -9 C-4.5 -9 -8 -5.5 -8 -1 C-8 3 0 11 0 11 C0 11 8 3 8 -1 C8 -5.5 4.5 -9 0 -9 Z"
        fill={filled ? NAVY : MAP_BEIGE}
        stroke={NAVY}
        strokeWidth="1"
      />
      <circle cx="0" cy="-2" r="2.2" fill={filled ? "#fff" : NAVY} />
    </g>
  );
}

interface Props {
  className?: string;
}

export default function OrientalMap({ className = "" }: Props) {
  const { L, lang } = useLocale();
  const rtl = lang === "ar";

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 220 280"
        className="mx-auto h-auto w-full max-w-lg"
        role="img"
        aria-label={L({ fr: "Carte — région de l'Oriental", ar: "خريطة — جهة الشرقية" })}
      >
        <rect width="220" height="280" fill="transparent" />
        <g transform="translate(12, 8)">
          <path d={MOROCCO_OUTLINE} fill={MAP_BEIGE} stroke={MAP_STROKE} strokeWidth="0.8" strokeLinejoin="round" />
          <path
            d={ORIENTAL_PATH}
            fill={NAVY}
            stroke={NAVY}
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          {OTHER_PINS.map((p, i) => (
            <Pin key={`other-${i}`} cx={p.x} cy={p.y} filled={false} />
          ))}
          {ORIENTAL_MARKERS.map(({ id, x, y, labelX, labelY }) => {
            const city = cities.find((c) => c.id === id);
            if (!city) return null;
            const lx = rtl ? 200 - labelX : labelX;
            const anchor = rtl ? "start" : "end";
            const lineX1 = rtl ? lx - 4 : lx + 4;
            return (
              <g key={id}>
                <line x1={lineX1} y1={labelY} x2={x} y2={y} stroke={NAVY} strokeWidth="0.6" opacity="0.45" />
                <Pin cx={x} cy={y} />
                <text
                  x={lx}
                  y={labelY + 3}
                  textAnchor={anchor}
                  fill={NAVY}
                  className="text-[8px] font-semibold"
                  style={{ fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {L(city.name)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
