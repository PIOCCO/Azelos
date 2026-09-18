import { createContext, ReactNode, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; kind: "success" | "error" };

const ToastContext = createContext<{ push: (message: string, kind?: "success" | "error") => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: "success" | "error" = "success") => {
    const id = Date.now();
    setItems((t) => [...t, { id, message, kind }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toasts">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}
