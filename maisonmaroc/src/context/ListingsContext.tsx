import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { properties as seedProperties } from "../data/properties";
import { owners as seedOwners } from "../data/owners";
import type { Owner, Property } from "../data/types";
import { slugify } from "../lib/slug";
import { cityCoords } from "../lib/cityCoords";

const STORAGE_KEY = "mm.published";

interface PublishedBundle {
  property: Property;
  owner: Owner;
}

interface ListingsContextValue {
  properties: Property[];
  owners: Owner[];
  propertyById: (id: string) => Property | undefined;
  propertyBySlug: (slug: string) => Property | undefined;
  propertiesByOwner: (ownerId: string) => Property[];
  ownerById: (id: string) => Owner | undefined;
  publishListing: (input: PublishInput) => Property;
}

export interface PublishInput {
  transaction: "sale" | "rent";
  type: Property["type"];
  title: string;
  description: string;
  price: number;
  cityId: string;
  neighborhood: string;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  amenities: Property["amenities"];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

function loadPublished(): PublishedBundle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PublishedBundle[]) : [];
  } catch {
    return [];
  }
}

function savePublished(bundles: PublishedBundle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bundles));
}

const ListingsContext = createContext<ListingsContextValue | undefined>(
  undefined,
);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [published, setPublished] = useState<PublishedBundle[]>(loadPublished);

  const publishedProperties = useMemo(
    () => published.map((b) => b.property),
    [published],
  );
  const publishedOwners = useMemo(
    () => published.map((b) => b.owner),
    [published],
  );

  const properties = useMemo(
    () => [...seedProperties, ...publishedProperties],
    [publishedProperties],
  );

  const owners = useMemo(
    () => [...seedOwners, ...publishedOwners],
    [publishedOwners],
  );

  const propertyById = useCallback(
    (id: string) => properties.find((p) => p.id === id),
    [properties],
  );

  const propertyBySlug = useCallback(
    (slug: string) => properties.find((p) => p.slug === slug),
    [properties],
  );

  const propertiesByOwner = useCallback(
    (ownerId: string) => properties.filter((p) => p.ownerId === ownerId),
    [properties],
  );

  const ownerById = useCallback(
    (id: string) => owners.find((o) => o.id === id),
    [owners],
  );

  const publishListing = useCallback((input: PublishInput) => {
    const baseSlug = slugify(input.title) || "listing";
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const ownerId = `pub-${slug}`;
    const coords = cityCoords[input.cityId] ?? cityCoords.casablanca;
    const phone = input.contactPhone.startsWith("+")
      ? input.contactPhone
      : `+212${input.contactPhone.replace(/\D/g, "").slice(-9)}`;
    const whatsapp = phone.replace(/\D/g, "").replace(/^212/, "212");

    const owner: Owner = {
      id: ownerId,
      name: { ar: input.contactName, fr: input.contactName },
      type: "owner",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.contactName)}`,
      verified: false,
      rating: 5,
      reviewsCount: 0,
      phone,
      whatsapp,
      email: input.contactEmail,
      cityId: input.cityId,
      memberSince: new Date().toISOString().slice(0, 10),
      responseTimeMinutes: 60,
      bio: {
        ar: "مالك عقار ينشر عبر APIO.",
        fr: "Propriétaire publiant via APIO.",
      },
      languages: ["ar", "fr"],
    };

    const property: Property = {
      id: `user-${slug}`,
      slug,
      title: { ar: input.title, fr: input.title },
      type: input.type,
      transaction: input.transaction,
      price: input.price,
      cityId: input.cityId,
      neighborhood: { ar: input.neighborhood, fr: input.neighborhood },
      surface: input.surface,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      furnished: input.furnished,
      amenities: input.amenities,
      description: { ar: input.description, fr: input.description },
      images: [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1280&q=70",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1280&q=70",
      ],
      publishedDate: new Date().toISOString().slice(0, 10),
      verified: false,
      ownerId,
      lat: coords.lat,
      lng: coords.lng,
    };

    const bundle = { property, owner };
    setPublished((prev) => {
      const next = [...prev, bundle];
      savePublished(next);
      return next;
    });
    return property;
  }, []);

  const value = useMemo(
    () => ({
      properties,
      owners,
      propertyById,
      propertyBySlug,
      propertiesByOwner,
      ownerById,
      publishListing,
    }),
    [
      properties,
      owners,
      propertyById,
      propertyBySlug,
      propertiesByOwner,
      ownerById,
      publishListing,
    ],
  );

  return (
    <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error("useListings must be used within ListingsProvider");
  return ctx;
}
