import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../lib/useLocale";
import { cities } from "../../data/cities";
import { ORIENTAL_MAP_CITIES, projectOnMap } from "../../data/orientalMapGeo";

const NAVY = "#1a2332";
const MAP_CREAM = "#efe9e0";
const MAP_BORDER = "#d8cfc4";
const DIVIDER = "#ddd4c9";
const LABEL_DARK = "#1a2332";
const LABEL_LIGHT = "#ffffff";

/** Morocco silhouette tuned to `projectOnMap` bounds. */
const MOROCCO_OUTLINE =
  "M16 98 L30 62 L48 44 L74 32 L102 28 L128 32 L154 34 L176 32 L196 38 L214 56 L222 86 L224 118 L220 154 L210 192 L192 228 L168 258 L140 276 L110 282 L80 278 L54 262 L34 238 L22 208 L14 172 L12 136 L14 108 Z";

/** Oriental region (north-east), aligned with projected WGS84 cluster. */
const ORIENTAL_REGION =
  "M118 38 L172 34 L208 52 L220 88 L216 128 L204 168 L182 208 L152 248 L122 258 L104 210 L98 168 L96 128 L102 88 Z";

const ORIENTAL_POLY: [number, number][] = [
  [118, 38], [172, 34], [208, 52], [220, 88], [216, 128], [204, 168], [182, 208], [152, 248],
  [122, 258], [104, 210], [98, 168], [96, 128], [102, 88],
];

/** Stylized internal borders (decorative, not survey lines). */
const REGION_DIVIDERS = [
  "M52 118 L118 108 L200 98",
  "M44 158 L128 148 L208 138",
  "M38 198 L112 188 L188 178",
  "M72 248 L148 238 L196 228",
  "M128 108 L142 198 L156 268",
  "M168 52 L158 142 L148 232",
];

/** Other Moroccan cities — pin only (WGS84), no extra labels. */
const OTHER_CITY_PINS: { lon: number; lat: number }[] = [
  { lon: -6.849813, lat: 34.020882 },
  { lon: -7.589843, lat: 33.573109 },
  { lon: -5.007845, lat: 34.261997 },
  { lon: -7.981084, lat: 31.629472 },
  { lon: -9.598107, lat: 30.427755 },
  { lon: -4.999892, lat: 35.759465 },
];

type LabelPlacement = {
  dx: number;
  dy: number;
  anchor: "start" | "end" | "middle";
};

const LABEL_PLACEMENT: Record<string, LabelPlacement> = {
  oujda: { dx: -52, dy: -6, anchor: "end" },
  nador: { dx: 14, dy: -14, anchor: "start" },
  berkane: { dx: -48, dy: 4, anchor: "end" },
  taourirt: { dx: -54, dy: 8, anchor: "end" },
  jerada: { dx: -58, dy: 0, anchor: "end" },
  figuig: { dx: -50, dy: 10, anchor: "end" },
  driouch: { dx: 16, dy: -8, anchor: "start" },
  guercif: { dx: -56, dy: 6, anchor: "end" },
};

function pointInPolygon(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

type PlacedCity = {
  id: string;
  x: number;
  y: number;
  label: string;
  href: string | null;
  inOriental: boolean;
  placement: LabelPlacement;
};

function MapPin({ light }: { light: boolean }) {
  return (
    <g>
      <path
        d="M0 -8.5 C-4.2 -8.5 -7.5 -5.2 -7.5 -1.2 C-7.5 2.5 0 10.5 0 10.5 C0 10.5 7.5 2.5 7.5 -1.2 C7.5 -5.2 4.2 -8.5 0 -8.5 Z"
        fill={light ? "#ffffff" : NAVY}
        stroke={light ? "#ffffff" : NAVY}
        strokeWidth="0.9"
      />
      <circle cy="-2" r="2" fill={light ? NAVY : "#ffffff"} />
    </g>
  );
}

interface Props {
  className?: string;
}

export default function OrientalMap({ className = "" }: Props) {
  const { L, lang } = useLocale();
  const navigate = useNavigate();
  const rtl = lang === "ar";
  const [activeId, setActiveId] = useState<string | null>(null);

  const placed = useMemo((): PlacedCity[] => {
    return ORIENTAL_MAP_CITIES.map((c) => {
      const { x, y } = projectOnMap(c.lon, c.lat);
      const fromData = cities.find((city) => city.id === c.id);
      const label = c.name ? L(c.name) : fromData ? L(fromData.name) : c.id;
      const href = fromData ? `/projets?city=${c.id}` : null;
      const inOriental = pointInPolygon(x, y, ORIENTAL_POLY);
      const placement = LABEL_PLACEMENT[c.id] ?? { dx: rtl ? 48 : -48, dy: -4, anchor: rtl ? "start" : "end" };
      return { id: c.id, x, y, label, href, inOriental, placement };
    });
  }, [L, rtl]);

  const otherPins = useMemo(() => OTHER_CITY_PINS.map((p) => projectOnMap(p.lon, p.lat)), []);

  const mapOffsetX = 24;

  return (
    <div className={`oriental-map-shell ${className}`}>
      <svg
        viewBox="0 0 360 392"
        className="oriental-map-svg"
        role="img"
        aria-label={L({ fr: "Carte du Maroc — région de l'Oriental", ar: "خريطة المغرب — جهة الشرقية" })}
      >
        <g transform={`translate(${mapOffsetX}, 12)`}>
          <path d={MOROCCO_OUTLINE} fill={MAP_CREAM} stroke={MAP_BORDER} strokeWidth="0.9" strokeLinejoin="round" />

          {REGION_DIVIDERS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={DIVIDER}
              strokeWidth="0.55"
              strokeLinecap="round"
              opacity="0.85"
            />
          ))}

          <path d={ORIENTAL_REGION} fill={NAVY} stroke={NAVY} strokeWidth="0.5" strokeLinejoin="round" />

          {otherPins.map((p, i) => (
            <g key={`pin-${i}`} transform={`translate(${p.x}, ${p.y})`} opacity="0.55">
              <MapPin light={false} />
            </g>
          ))}

          {placed.map((city) => {
            const active = activeId === city.id;
            const pinLight = city.inOriental;
            const { dx, dy, anchor } = city.placement;
            const labelX = rtl ? -dx : dx;
            const labelAnchor = rtl ? (anchor === "end" ? "start" : anchor === "start" ? "end" : anchor) : anchor;
            const labelFill = city.inOriental ? LABEL_LIGHT : LABEL_DARK;
            const lineOpacity = active ? 0.55 : 0.35;

            const go = () => {
              if (city.href) navigate(city.href);
            };

            return (
              <g
                key={city.id}
                className={`oriental-map-marker ${city.href ? "oriental-map-marker--link" : ""}`}
                transform={`translate(${city.x}, ${city.y})`}
                onMouseEnter={() => setActiveId(city.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(city.id)}
                onBlur={() => setActiveId(null)}
                role={city.href ? "link" : "presentation"}
                tabIndex={city.href ? 0 : undefined}
                onClick={go}
                onKeyDown={(e) => {
                  if (city.href && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    go();
                  }
                }}
              >
                <line
                  x1={0}
                  y1={0}
                  x2={labelX}
                  y2={dy}
                  stroke={city.inOriental ? "#ffffff" : NAVY}
                  strokeWidth="0.6"
                  opacity={lineOpacity}
                />
                <MapPin light={pinLight} />
                <text
                  x={labelX}
                  y={dy + 3}
                  textAnchor={labelAnchor}
                  fill={labelFill}
                  className={`oriental-map-label ${active ? "oriental-map-label--active" : ""}`}
                  style={{ fontWeight: active ? 700 : 600 }}
                >
                  {city.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
