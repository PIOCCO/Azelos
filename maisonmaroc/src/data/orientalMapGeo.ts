import type { Bilingual } from "./types";

/** WGS84 bounds for Morocco (mainland), used only for map projection — not survey data. */
export const MOROCCO_MAP_BOUNDS = {
  minLon: -13.15,
  maxLon: -0.98,
  minLat: 27.65,
  maxLat: 35.95,
};

/** Provincial capitals / major towns in the Oriental region (WGS84). */
export const ORIENTAL_MAP_CITIES: {
  id: string;
  lon: number;
  lat: number;
  /** When absent, name is resolved from `cities` data. */
  name?: Bilingual;
}[] = [
  { id: "oujda", lon: -1.911389, lat: 34.686667 },
  { id: "nador", lon: -2.933611, lat: 35.168333 },
  { id: "berkane", lon: -2.319722, lat: 34.921389 },
  { id: "taourirt", lon: -2.897222, lat: 34.407222 },
  { id: "jerada", lon: -2.163611, lat: 34.311667 },
  { id: "figuig", lon: -1.955556, lat: 32.488889 },
  {
    id: "driouch",
    lon: -3.646111,
    lat: 35.083333,
    name: { fr: "Driouch", ar: "إدّويش" },
  },
  { id: "guercif", lon: -3.353611, lat: 34.225 },
];

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

/** Project WGS84 coordinates onto the simplified Morocco SVG (monotonic, not cadastral). */
export function projectOnMap(lon: number, lat: number): { x: number; y: number } {
  const { minLon, maxLon, minLat, maxLat } = MOROCCO_MAP_BOUNDS;
  const nx = clamp01((lon - minLon) / (maxLon - minLon));
  const ny = clamp01((maxLat - lat) / (maxLat - minLat));
  return {
    x: 20 + nx * 0.76 * 206,
    y: 34 + Math.pow(ny, 0.86) * 248,
  };
}
