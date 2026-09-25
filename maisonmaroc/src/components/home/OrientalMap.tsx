import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../lib/useLocale";
import { cities } from "../../data/cities";
import { MAP_CITY_MARKERS, projectOnMap, ORIENTAL_POLYGON_SAMPLE } from "../../data/orientalMapGeo";
import { MOROCCO_MAP_VIEWBOX, MOROCCO_REGION_PATHS } from "../../data/moroccoMapPaths";

const NAVY = "#1a2332";
const MAP_FILL = "#f7f7f5";
const MAP_STROKE = "#e3e3e3";
const LABEL_DARK = "#1a2332";
const LABEL_LIGHT = "#ffffff";

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

function MapPin() {
  return (
    <g transform="translate(0, 0)">
      <path
        d="M0 -7.5 C-3.8 -7.5 -6.8 -4.6 -6.8 -1 C-6.8 2.8 0 9.5 0 9.5 C0 9.5 6.8 2.8 6.8 -1 C6.8 -4.6 3.8 -7.5 0 -7.5 Z"
        fill={NAVY}
        stroke={NAVY}
        strokeWidth="0.6"
      />
      <circle cy="-1.5" r="1.8" fill="#ffffff" />
    </g>
  );
}

type PlacedCity = {
  id: string;
  x: number;
  y: number;
  label: string;
  href: string | null;
  inOriental: boolean;
  dx: number;
  dy: number;
};

interface Props {
  className?: string;
}

export default function OrientalMap({ className = "" }: Props) {
  const { L, lang } = useLocale();
  const navigate = useNavigate();
  const rtl = lang === "ar";
  const [activeId, setActiveId] = useState<string | null>(null);

  const placed = useMemo((): PlacedCity[] => {
    return MAP_CITY_MARKERS.map((c) => {
      const { x, y } = projectOnMap(c.lon, c.lat);
      const fromData = cities.find((city) => city.id === c.id);
      const label = L(c.name);
      const href = fromData ? `/projets?city=${c.id}` : null;
      const inOriental = pointInPolygon(x, y, ORIENTAL_POLYGON_SAMPLE);
      const off = c.labelOffset ?? { dx: rtl ? 8 : -8, dy: -8 };
      const dx = rtl ? -off.dx : off.dx;
      return { id: c.id, x, y, label, href, inOriental, dx, dy: off.dy };
    });
  }, [L, rtl]);

  const { width, height } = MOROCCO_MAP_VIEWBOX;

  return (
    <div className={`oriental-map-shell ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="oriental-map-svg"
        role="img"
        aria-label={L({ fr: "Carte du Maroc — région de l'Oriental", ar: "خريطة المغرب — جهة الشرقية" })}
      >
        <rect width={width} height={height} fill="#ffffff" />

        {MOROCCO_REGION_PATHS.filter((r) => !r.oriental).map((region) => (
          <path
            key={region.id}
            d={region.path}
            fill={MAP_FILL}
            stroke={MAP_STROKE}
            strokeWidth="0.65"
            strokeLinejoin="round"
          />
        ))}

        {MOROCCO_REGION_PATHS.filter((r) => r.oriental).map((region) => (
          <path
            key={region.id}
            d={region.path}
            fill={NAVY}
            stroke={NAVY}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        ))}

        {placed.map((city) => {
          const active = activeId === city.id;
          const labelFill = city.inOriental ? LABEL_LIGHT : LABEL_DARK;
          const anchor = city.dx > 0 ? "start" : "end";
          const labelX = city.dx;
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
              <MapPin />
              <text
                x={labelX}
                y={city.dy}
                textAnchor={anchor}
                fill={labelFill}
                className={`oriental-map-label ${city.inOriental ? "oriental-map-label--light" : "oriental-map-label--dark"} ${active ? "oriental-map-label--active" : ""}`}
              >
                {city.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
