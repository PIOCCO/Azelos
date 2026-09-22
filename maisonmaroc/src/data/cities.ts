import type { City } from "./types";

export const cities: City[] = [
  {
    id: "casablanca",
    name: { ar: "الدار البيضاء", fr: "Casablanca" },
    image:
      "https://images.unsplash.com/photo-1577147443647-81856d5151af?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "المعاريف", fr: "Maârif" },
      { ar: "عين الذئاب", fr: "Aïn Diab" },
      { ar: "غوتييه", fr: "Gauthier" },
      { ar: "بورغون", fr: "Bourgogne" },
      { ar: "أنفا", fr: "Anfa" },
      { ar: "سيدي معروف", fr: "Sidi Maârouf" },
    ],
  },
  {
    id: "rabat",
    name: { ar: "الرباط", fr: "Rabat" },
    image:
      "https://images.unsplash.com/photo-1622551858894-8e0f8b8b0f0e?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "أكدال", fr: "Agdal" },
      { ar: "حي الرياض", fr: "Hay Riad" },
      { ar: "السويسي", fr: "Souissi" },
      { ar: "حسان", fr: "Hassan" },
      { ar: "المحيط", fr: "L'Océan" },
    ],
  },
  {
    id: "marrakech",
    name: { ar: "مراكش", fr: "Marrakech" },
    image:
      "https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "غيليز", fr: "Guéliz" },
      { ar: "الشتوية", fr: "Hivernage" },
      { ar: "النخيل", fr: "Palmeraie" },
      { ar: "المدينة", fr: "Médina" },
      { ar: "طريق أوريكة", fr: "Route de l'Ourika" },
    ],
  },
  {
    id: "tangier",
    name: { ar: "طنجة", fr: "Tanger" },
    image:
      "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "مالاباطا", fr: "Malabata" },
      { ar: "رأس سبارطيل", fr: "Cap Spartel" },
      { ar: "المرشان", fr: "Marshan" },
      { ar: "إبيريا", fr: "Iberia" },
      { ar: "بوخالف", fr: "Boukhalef" },
    ],
  },
  {
    id: "agadir",
    name: { ar: "أكادير", fr: "Agadir" },
    image:
      "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "فونتي", fr: "Founty" },
      { ar: "طالبرجت", fr: "Talborjt" },
      { ar: "الداخلة", fr: "Dakhla" },
      { ar: "سونابا", fr: "Sonaba" },
    ],
  },
  {
    id: "fes",
    name: { ar: "فاس", fr: "Fès" },
    image:
      "https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=800&q=70",
    neighborhoods: [
      { ar: "فاس البالي", fr: "Fès El Bali" },
      { ar: "سايس", fr: "Saïss" },
      { ar: "أكدال فاس", fr: "Agdal" },
      { ar: "المدينة الجديدة", fr: "Ville Nouvelle" },
    ],
  },
];

export const cityById = (id: string) => cities.find((c) => c.id === id);
