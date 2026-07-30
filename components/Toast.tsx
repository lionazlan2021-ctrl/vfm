"use client";

import { useState, useCallback, createContext, useContext } from "react";

type Toast = { id: string; msg: string; type: "success" | "error" };
type ToastContextType = { push: (msg: string, type?: "success" | "error") => void };

const ToastContext = createContext<ToastContextType>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 items-center">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[12.5px] font-medium shadow-lg"
            style={{
              background: "#111815",
              border: `1px solid ${t.type === "error" ? "rgba(239,68,68,.35)" : "rgba(45,190,95,.3)"}`,
              color: t.type === "error" ? "#fca5a5" : "#2dbe5f",
              animation: "toastIn .25s ease",
            }}
          >
            <span>{t.type === "error" ? "⚠️" : "✓"}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
