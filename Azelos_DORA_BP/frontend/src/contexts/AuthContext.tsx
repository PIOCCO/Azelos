import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin, loginWithOidcIdToken } from "../api/dora";
import { setTokenProvider } from "../api/client";
import type { LoginResponse, Role } from "../api/types";

const STORAGE_KEY = "dora.session";

interface Session {
  token: string;
  organizationId: string;
  role: Role;
  email: string;
}

interface AuthContextValue {
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithOidc: (idToken: string, emailHint?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<Session | null>(null);

  const syncToken = useCallback((s: Session | null) => {
    sessionRef.current = s;
    setTokenProvider(() => sessionRef.current?.token ?? null);
  }, []);

  const [session, setSession] = useState<Session | null>(() => {
    const s = loadSession();
    sessionRef.current = s;
    setTokenProvider(() => sessionRef.current?.token ?? null);
    return s;
  });

  const persist = useCallback(
    (s: Session | null) => {
      syncToken(s);
      setSession(s);
      if (s) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      else sessionStorage.removeItem(STORAGE_KEY);
    },
    [syncToken],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res: LoginResponse = await apiLogin(email, password);
      persist({
        token: res.access_token,
        organizationId: res.organization_id,
        role: res.role,
        email,
      });
    },
    [persist],
  );

  const loginWithOidc = useCallback(
    async (idToken: string, emailHint?: string) => {
      const res: LoginResponse = await loginWithOidcIdToken(idToken);
      persist({
        token: res.access_token,
        organizationId: res.organization_id,
        role: res.role,
        email: emailHint ?? "oidc-user",
      });
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ session, login, loginWithOidc, logout }),
    [session, login, loginWithOidc, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider required");
  return ctx;
}
