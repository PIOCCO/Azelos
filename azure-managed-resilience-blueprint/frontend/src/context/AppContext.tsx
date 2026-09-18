import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api } from "../api";

type Meta = { product_name: string; demo_mode: boolean; auth_mode: string; environment: string };
type Session = { role: string; tenantId: string; email?: string };

type AppContextValue = {
  meta: Meta | null;
  session: Session;
  setTenantId: (id: string) => void;
  isProvider: boolean;
  refreshMeta: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [tenantId, setTenantIdState] = useState(localStorage.getItem("atlas_tenant") || "tenant-demo");
  const role = localStorage.getItem("atlas_role") || "PROVIDER_ADMIN";

  const setTenantId = (id: string) => {
    localStorage.setItem("atlas_tenant", id);
    setTenantIdState(id);
  };

  const refreshMeta = async () => {
    try {
      setMeta(await api<Meta>("/platform/meta"));
    } catch {
      setMeta(null);
    }
  };

  useEffect(() => {
    refreshMeta();
  }, []);

  const value = useMemo(
    () => ({
      meta,
      session: { role, tenantId },
      setTenantId,
      isProvider: role === "PROVIDER_ADMIN" || role === "OPERATOR",
      refreshMeta,
    }),
    [meta, role, tenantId],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppProvider missing");
  return ctx;
}
