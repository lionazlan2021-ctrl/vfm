"use client";

import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";

type Toast = { id: string; msg: string; type: "success" | "error" };
type ToastContextType = { push: (msg: string, type?: "success" | "error") => void };

const ToastContext = createContext<ToastContextType>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear pending timers on unmount so they can't fire against a dead component.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const push = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type }]);
    timers.current.push(setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200));
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 items-center px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="text-[13px] px-4 py-2.5 rounded-lg"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
              borderLeft: `3px solid ${t.type === "error" ? "var(--flag)" : "var(--accent)"}`,
              animation: "riseIn .25s ease both",
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
