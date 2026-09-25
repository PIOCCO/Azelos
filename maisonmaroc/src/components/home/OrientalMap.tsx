import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../lib/useLocale";
import { cities } from "../../data/cities";
import { ORIENTAL_MAP_CITIES, projectOnMap } from "../../data/orientalMapGeo";

const NAVY = "#1a2332";
const NAVY_SOFT = "#243044";
const MAP_BEIGE = "#e8e2d9";
const MAP_BEIGE_DEEP = "#ddd6cc";
const MAP_STROKE = "#bfb5a8";
const LABEL_BG = "#faf8f5";

const MAP_W = 280;
const MAP_H = 340;

/** Simplified Morocco outline (north-up), tuned to `MOROCCO_MAP_BOUNDS`. */
const MOROCCO_OUTLINE =
  "M18 92 L34 58 L52 42 L78 32 L104 30 L128 34 L152 36 L172 34 L192 40 L210 58 L218 88 L220 118 L216 152 L206 188 L190 222 L168 252 L142 272 L112 280 L82 276 L56 260 L36 236 L24 206 L16 172 L14 138 L16 108 Z";

const ORIENTAL_REGION =
  "M112 36 L158 34 L188 42 L208 62 L214 96 L208 132 L196 168 L178 204 L158 236 L132 252 L112 238 L102 198 L98 158 L100 118 L106 78 Z";

type PlacedCity = {
  id: string;
  x: number;
  y: number;
  label: string;
  href: string | null;
};

function PinIcon({ active }: { active: boolean }) {
  return (
    <path
      d="M0 -10 C-5 -10 -8.5 -6 -8.5 -1.5 C-8.5 2.5 0 12 0 12 C0 12 8.5 2.5 8.5 -1.5 C8.5 -6 5 -10 0 -10 Z"
      fill={active ? NAVY : "#fff"}
      stroke={NAVY}
      strokeWidth="1.2"
    />
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
      const { x, y } = projectOnMap(c.lon, c.lat, MAP_W, MAP_H, 14);
      const fromData = cities.find((city) => city.id === c.id);
      const label = c.name ? L(c.name) : fromData ? L(fromData.name) : c.id;
      const href = fromData ? `/projets?city=${c.id}` : null;
      return { id: c.id, x, y, label, href };
    });
  }, [L]);

  return (
    <div className={`oriental-map-shell ${className}`}>
      <div className="oriental-map-head">
        <p className="oriental-map-kicker">
          {L({ fr: "Région administrative", ar: "الجهة الإدارية" })}
        </p>
        <p className="oriental-map-title">{L({ fr: "L'Oriental", ar: "الجهة الشرقية" })}</p>
      </div>

      <div className="oriental-map-canvas">
        <svg
          viewBox={`${rtl ? -70 : -70} 0 ${MAP_W + 70} ${MAP_H + 24}`}
          className="oriental-map-svg"
          role="img"
          aria-label={L({ fr: "Carte du Maroc — région de l'Oriental", ar: "خريطة المغرب — جهة الشرقية" })}
        >
          <defs>
            <filter id="map-soft-shadow" x="-8%" y="-8%" width="116%" height="116%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1a2332" floodOpacity="0.08" />
            </filter>
            <linearGradient id="morocco-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MAP_BEIGE} />
              <stop offset="100%" stopColor={MAP_BEIGE_DEEP} />
            </linearGradient>
          </defs>

          <g transform="translate(0, 8)" filter="url(#map-soft-shadow)">
            <path
              d={MOROCCO_OUTLINE}
              fill="url(#morocco-fill)"
              stroke={MAP_STROKE}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path
              d={ORIENTAL_REGION}
              fill={NAVY}
              fillOpacity="0.96"
              stroke={NAVY_SOFT}
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <text
              x="158"
              y="168"
              textAnchor="middle"
              fill="#ffffff"
              opacity="0.92"
              className="oriental-map-region-watermark"
            >
              Oriental
            </text>
          </g>

          {placed.map((city) => {
            const active = activeId === city.id;
            const labelX = rtl ? city.x + 58 : city.x - 58;
            const lineEndX = rtl ? city.x + 10 : city.x - 10;
            const labelAnchor = rtl ? "start" : "end";

            const go = () => {
              if (city.href) navigate(city.href);
            };

            return (
              <g
                key={city.id}
                className={`oriental-map-marker ${city.href ? "oriental-map-marker--link" : ""}`}
                onMouseEnter={() => setActiveId(city.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(city.id)}
                onBlur={() => setActiveId(null)}
                transform={`translate(${city.x}, ${city.y})`}
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
                <circle r={active ? 14 : 10} fill={NAVY} opacity={active ? 0.08 : 0} className="transition-all duration-200" />
                <line
                  x1={lineEndX - city.x}
                  y1={0}
                  x2={labelX - city.x}
                  y2={0}
                  stroke={NAVY}
                  strokeWidth="0.7"
                  opacity={active ? 0.55 : 0.32}
                />
                <g transform="translate(0, 0)">
                  <PinIcon active={active} />
                  <circle cy="-2.5" r="2.3" fill={active ? "#fff" : NAVY} />
                </g>
                <g transform={`translate(${labelX - city.x}, ${-4})`}>
                  <rect
                    x={rtl ? 0 : -92}
                    y={-11}
                    width={92}
                    height={18}
                    rx={4}
                    fill={LABEL_BG}
                    stroke={active ? NAVY : "#e7e0d6"}
                    strokeWidth="0.8"
                  />
                  <text
                    x={rtl ? 8 : -8}
                    y={2}
                    textAnchor={labelAnchor}
                    className={`oriental-map-label ${active ? "oriental-map-label--active" : ""}`}
                  >
                    {city.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="oriental-map-caption">
        {L({
          fr: "Principales villes de la région — positions approximatives (WGS84).",
          ar: "أهم مدن الجهة — مواقع تقريبية (WGS84).",
        })}
      </p>
    </div>
  );
}
