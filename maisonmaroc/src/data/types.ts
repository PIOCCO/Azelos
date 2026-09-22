export type Lang = "ar" | "fr";

export type Bilingual = { ar: string; fr: string };

export type TransactionType = "sale" | "rent";

export type PropertyType =
  | "apartment"
  | "villa"
  | "house"
  | "studio"
  | "office"
  | "commercial"
  | "land";

export type AmenityKey =
  | "parking"
  | "pool"
  | "garden"
  | "elevator"
  | "airConditioning"
  | "heating"
  | "security"
  | "terrace"
  | "balcony"
  | "furnished"
  | "seaView"
  | "concierge"
  | "fireplace"
  | "equippedKitchen";

export interface City {
  id: string;
  name: Bilingual;
  image: string;
  neighborhoods: Bilingual[];
}

export interface Owner {
  id: string;
  name: Bilingual;
  type: "agent" | "owner" | "agency";
  agency?: Bilingual;
  avatar: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  phone: string;
  whatsapp: string;
  email: string;
  cityId: string;
  memberSince: string; // ISO date
  responseTimeMinutes: number;
  bio: Bilingual;
  languages: Lang[];
}

export interface Property {
  id: string;
  slug: string;
  title: Bilingual;
  type: PropertyType;
  transaction: TransactionType;
  price: number; // MAD (rent = per month)
  cityId: string;
  neighborhood: Bilingual;
  surface: number; // m²
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  amenities: AmenityKey[];
  description: Bilingual;
  images: string[];
  publishedDate: string; // ISO
  verified: boolean;
  ownerId: string;
  featured?: boolean;
  lat: number;
  lng: number;
}

export interface Review {
  id: string;
  ownerId: string;
  author: Bilingual;
  rating: number;
  text: Bilingual;
  date: string; // ISO
  avatar: string;
}
