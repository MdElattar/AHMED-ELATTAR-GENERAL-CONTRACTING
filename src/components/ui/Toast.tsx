"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((current) => [...current.slice(-3), { id, kind, message }]);
      const timer = window.setTimeout(() => remove(id), 3600);
      timers.current.set(id, timer);
    },
    [remove],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[400] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:end-4 sm:items-end"
      >
        {items.map((item) => {
          const Icon = item.kind === "error" ? AlertCircle : CheckCircle2;
          return (
            <div
              key={item.id}
              role={item.kind === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex min-h-12 w-full max-w-sm items-start gap-3 border px-4 py-3 text-[0.8rem] leading-relaxed shadow-lux backdrop-blur-md",
                item.kind === "error"
                  ? "border-red-400/30 bg-[#160c0c]/95 text-red-100"
                  : "border-gold/30 bg-[#0e1017]/95 text-ivory",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  item.kind === "error" ? "text-red-300" : "text-gold",
                )}
              />
              <span className="min-w-0 flex-1">{item.message}</span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="shrink-0 text-ivory/45 transition-colors hover:text-ivory"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
