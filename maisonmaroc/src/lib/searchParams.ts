import type { AmenityKey, PropertyType, TransactionType } from "../data/types";
import type { PropertyFilters } from "./filter";

export function parseFilters(params: URLSearchParams): PropertyFilters {
  const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
  const amenities = params.getAll("amenity") as AmenityKey[];
  return {
    transaction: (params.get("transaction") as TransactionType) || "",
    city: params.get("city") || "",
    neighborhood: params.get("neighborhood") || "",
    type: (params.get("type") as PropertyType) || "",
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minSurface: num("minSurface"),
    maxSurface: num("maxSurface"),
    bedrooms: num("bedrooms"),
    bathrooms: num("bathrooms"),
    furnished: params.get("furnished") === "1",
    verifiedOnly: params.get("verified") === "1",
    amenities: amenities.length ? amenities : undefined,
  };
}

export function filtersToSearchParams(f: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.transaction) params.set("transaction", f.transaction);
  if (f.city) params.set("city", f.city);
  if (f.neighborhood) params.set("neighborhood", f.neighborhood);
  if (f.type) params.set("type", f.type);
  if (f.minPrice) params.set("minPrice", String(f.minPrice));
  if (f.maxPrice) params.set("maxPrice", String(f.maxPrice));
  if (f.minSurface) params.set("minSurface", String(f.minSurface));
  if (f.maxSurface) params.set("maxSurface", String(f.maxSurface));
  if (f.bedrooms) params.set("bedrooms", String(f.bedrooms));
  if (f.bathrooms) params.set("bathrooms", String(f.bathrooms));
  if (f.furnished) params.set("furnished", "1");
  if (f.verifiedOnly) params.set("verified", "1");
  f.amenities?.forEach((a) => params.append("amenity", a));
  return params;
}
