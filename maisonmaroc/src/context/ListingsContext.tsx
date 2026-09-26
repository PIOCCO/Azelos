import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../lib/api";
import type { Owner, Property } from "../data/types";

interface ListingsContextValue {
  properties: Property[];
  owners: Owner[];
  propertyById: (id: string) => Property | undefined;
  propertyBySlug: (slug: string) => Property | undefined;
  propertiesByOwner: (ownerId: string) => Property[];
  ownerById: (id: string) => Owner | undefined;
  refreshMemberListings: () => Promise<void>;
}

const ListingsContext = createContext<ListingsContextValue | undefined>(
  undefined,
);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);

  const refreshMemberListings = useCallback(async () => {
    const [listings, directory] = await Promise.all([
      apiFetch<{ properties: Property[]; owners: Owner[] }>(
        "/api/listings/member-properties",
      ),
      apiFetch<{ members: Owner[] }>("/api/public/members"),
    ]);

    setProperties(listings.data?.properties ?? []);

    const byId = new Map<string, Owner>();
    for (const o of directory.data?.members ?? []) byId.set(o.id, o);
    for (const o of listings.data?.owners ?? []) byId.set(o.id, o);
    setOwners([...byId.values()]);
  }, []);

  useEffect(() => {
    refreshMemberListings();
  }, [refreshMemberListings]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") refreshMemberListings();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshMemberListings]);

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

  const value = useMemo(
    () => ({
      properties,
      owners,
      propertyById,
      propertyBySlug,
      propertiesByOwner,
      ownerById,
      refreshMemberListings,
    }),
    [
      properties,
      owners,
      propertyById,
      propertyBySlug,
      propertiesByOwner,
      ownerById,
      refreshMemberListings,
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
