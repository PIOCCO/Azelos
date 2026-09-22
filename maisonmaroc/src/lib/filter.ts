import type { AmenityKey, Property, PropertyType, TransactionType } from "../data/types";

export interface PropertyFilters {
  transaction?: TransactionType | "";
  city?: string;
  neighborhood?: string;
  type?: PropertyType | "";
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  bedrooms?: number; // minimum
  bathrooms?: number; // minimum
  furnished?: boolean;
  amenities?: AmenityKey[];
  verifiedOnly?: boolean;
}

export type SortKey = "newest" | "priceAsc" | "priceDesc" | "surface";

export function filterProperties(
  items: Property[],
  f: PropertyFilters,
): Property[] {
  return items.filter((p) => {
    if (f.transaction && p.transaction !== f.transaction) return false;
    if (f.city && p.cityId !== f.city) return false;
    if (f.neighborhood && p.neighborhood.fr !== f.neighborhood && p.neighborhood.ar !== f.neighborhood)
      return false;
    if (f.type && p.type !== f.type) return false;
    if (f.minPrice && p.price < f.minPrice) return false;
    if (f.maxPrice && p.price > f.maxPrice) return false;
    if (f.minSurface && p.surface < f.minSurface) return false;
    if (f.maxSurface && p.surface > f.maxSurface) return false;
    if (f.bedrooms && p.bedrooms < f.bedrooms) return false;
    if (f.bathrooms && p.bathrooms < f.bathrooms) return false;
    if (f.furnished && !p.furnished) return false;
    if (f.verifiedOnly && !p.verified) return false;
    if (f.amenities && f.amenities.length > 0) {
      const ok = f.amenities.every((a) => p.amenities.includes(a));
      if (!ok) return false;
    }
    return true;
  });
}

export function sortProperties(items: Property[], key: SortKey): Property[] {
  const copy = [...items];
  switch (key) {
    case "priceAsc":
      return copy.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return copy.sort((a, b) => b.price - a.price);
    case "surface":
      return copy.sort((a, b) => b.surface - a.surface);
    case "newest":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.publishedDate).getTime() -
          new Date(a.publishedDate).getTime(),
      );
  }
}
