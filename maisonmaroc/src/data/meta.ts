import type { AmenityKey, PropertyType, TransactionType } from "./types";

// Icon names map to lucide-react icons (resolved in the UI layer).
export const amenityMeta: Record<AmenityKey, { icon: string }> = {
  parking: { icon: "Car" },
  pool: { icon: "Waves" },
  garden: { icon: "Trees" },
  elevator: { icon: "ArrowUpDown" },
  airConditioning: { icon: "Snowflake" },
  heating: { icon: "Flame" },
  security: { icon: "ShieldCheck" },
  terrace: { icon: "Sun" },
  balcony: { icon: "PanelTop" },
  furnished: { icon: "Sofa" },
  seaView: { icon: "Waves" },
  concierge: { icon: "BellRing" },
  fireplace: { icon: "Flame" },
  equippedKitchen: { icon: "CookingPot" },
};

export const amenityKeys = Object.keys(amenityMeta) as AmenityKey[];

export const propertyTypeKeys: PropertyType[] = [
  "apartment",
  "villa",
  "house",
  "studio",
  "office",
  "commercial",
  "land",
];

export const transactionKeys: TransactionType[] = ["sale", "rent"];
