import type { Bilingual } from "./types";
export { projectMoroccoMap as projectOnMap, ORIENTAL_POLYGON_SAMPLE } from "./moroccoMapPaths";

export type MapCityMarker = {
  id: string;
  lon: number;
  lat: number;
  name: Bilingual;
  /** Optional fine-tune for label position (SVG px). */
  labelOffset?: { dx: number; dy: number };
};

/** WGS84 coordinates — provincial / major city locations (not cadastral). */
export const MAP_CITY_MARKERS: MapCityMarker[] = [
  { id: "oujda", lon: -1.911389, lat: 34.686667, name: { fr: "Oujda", ar: "وجدة" }, labelOffset: { dx: 8, dy: -10 } },
  { id: "nador", lon: -2.933611, lat: 35.168333, name: { fr: "Nador", ar: "الناظور" }, labelOffset: { dx: 8, dy: -12 } },
  { id: "berkane", lon: -2.319722, lat: 34.921389, name: { fr: "Berkane", ar: "بركان" }, labelOffset: { dx: -8, dy: -10 } },
  { id: "taourirt", lon: -2.897222, lat: 34.407222, name: { fr: "Taourirt", ar: "تاوريرت" }, labelOffset: { dx: -8, dy: 8 } },
  { id: "jerada", lon: -2.163611, lat: 34.311667, name: { fr: "Jerada", ar: "جرادة" }, labelOffset: { dx: -8, dy: 6 } },
  { id: "figuig", lon: -1.955556, lat: 32.488889, name: { fr: "Figuig", ar: "فجيج" }, labelOffset: { dx: 8, dy: 10 } },
  { id: "guercif", lon: -3.353611, lat: 34.225, name: { fr: "Guercif", ar: "جرسيف" }, labelOffset: { dx: -8, dy: 6 } },
  { id: "tanger", lon: -5.813647, lat: 35.759465, name: { fr: "Tanger", ar: "طنجة" }, labelOffset: { dx: -8, dy: -10 } },
  { id: "tetouan", lon: -5.36837, lat: 35.588874, name: { fr: "Tétouan", ar: "تطوان" }, labelOffset: { dx: 8, dy: -8 } },
  { id: "hoceima", lon: -3.931611, lat: 35.251658, name: { fr: "Al Hoceïma", ar: "الحسيمة" }, labelOffset: { dx: 8, dy: -10 } },
  { id: "taza", lon: -4.006026, lat: 34.213212, name: { fr: "Taza", ar: "تازة" }, labelOffset: { dx: -8, dy: 4 } },
  { id: "fes", lon: -4.999892, lat: 34.0331, name: { fr: "Fès", ar: "فاس" }, labelOffset: { dx: -8, dy: 6 } },
  { id: "meknes", lon: -5.547273, lat: 33.893528, name: { fr: "Meknès", ar: "مكناس" }, labelOffset: { dx: -8, dy: 8 } },
  { id: "rabat", lon: -6.849813, lat: 34.020882, name: { fr: "Rabat", ar: "الرباط" }, labelOffset: { dx: -8, dy: -8 } },
  { id: "casablanca", lon: -7.589843, lat: 33.573109, name: { fr: "Casablanca", ar: "الدار البيضاء" }, labelOffset: { dx: -8, dy: 8 } },
  { id: "marrakech", lon: -7.981084, lat: 31.629472, name: { fr: "Marrakech", ar: "مراكش" }, labelOffset: { dx: -8, dy: 10 } },
  { id: "agadir", lon: -9.598107, lat: 30.427755, name: { fr: "Agadir", ar: "أكادير" }, labelOffset: { dx: -8, dy: 10 } },
];

/** @deprecated Use MAP_CITY_MARKERS — kept for any legacy imports. */
export const ORIENTAL_MAP_CITIES = MAP_CITY_MARKERS.filter((c) =>
  ["oujda", "nador", "berkane", "taourirt", "jerada", "figuig", "guercif"].includes(c.id),
);
