import type { City } from "./types";

/** Oriental region — agency service area (Oujda & surroundings). */
export const cities: City[] = [
  {
    id: "oujda",
    name: { ar: "وجدة", fr: "Oujda" },
    image:
      "https://images.unsplash.com/photo-1518548419970-58e985b0a4a2?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "حي القدس", fr: "Hay Al Qods" },
      { ar: "حي الإيرفان", fr: "Hay Al Irfane" },
      { ar: "وسط المدينة", fr: "Centre-ville" },
      { ar: "حي الحكمة", fr: "Hay Al Hikma" },
      { ar: "لازaret", fr: "Lazaret" },
      { ar: "سيدي يحيى", fr: "Sidi Yahya" },
      { ar: "الأندلس", fr: "Al Andalous" },
    ],
  },
  {
    id: "berkane",
    name: { ar: "بركان", fr: "Berkane" },
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "وسط المدينة", fr: "Centre-ville" },
      { ar: "أنجاد", fr: "Angads" },
      { ar: "العبدين", fr: "Laâbidine" },
      { ar: "حي النهضة", fr: "Hay Nahda" },
    ],
  },
  {
    id: "nador",
    name: { ar: "الناظور", fr: "Nador" },
    image:
      "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "وسط المدينة", fr: "Centre-ville" },
      { ar: "العروي", fr: "Al Aroui" },
      { ar: "سلوان", fr: "Selouane" },
      { ar: "حي المستقبل", fr: "Hay Al Mustaqbal" },
    ],
  },
  {
    id: "taourirt",
    name: { ar: "تاوريرت", fr: "Taourirt" },
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "وسط المدينة", fr: "Centre-ville" },
      { ar: "حي الجامعة", fr: "Hay Al Jamia" },
    ],
  },
  {
    id: "jerada",
    name: { ar: "جرادة", fr: "Jerada" },
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [{ ar: "وسط المدينة", fr: "Centre-ville" }],
  },
  {
    id: "ahfir",
    name: { ar: "احفير", fr: "Ahfir" },
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [{ ar: "وسط المدينة", fr: "Centre-ville" }],
  },
  {
    id: "saidia",
    name: { ar: "السعيدية", fr: "Saïdia" },
    image:
      "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "الشاطئ", fr: "Front de mer" },
      { ar: "مارينا", fr: "Marina" },
      { ar: "وسط المدينة", fr: "Centre-ville" },
    ],
  },
  {
    id: "figuig",
    name: { ar: "فجيج", fr: "Figuig" },
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [{ ar: "وسط المدينة", fr: "Centre-ville" }],
  },
  {
    id: "guercif",
    name: { ar: "جرسيف", fr: "Guercif" },
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "وسط المدينة", fr: "Centre-ville" },
      { ar: "حي النصر", fr: "Hay An Nasr" },
    ],
  },
];

export const cityById = (id: string) => cities.find((c) => c.id === id);

export const DEFAULT_CITY_ID = "oujda";
