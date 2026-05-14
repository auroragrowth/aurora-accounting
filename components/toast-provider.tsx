"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, AlertCircle } from "lucide-react";

type ToastKind = "success" | "error";
interface ToastState { msg: string; kind: ToastKind; id: number }
interface ToastContextValue {
  showToast: (msg: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = Date.now();
    setToast({ msg, kind, id });
    setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className="no-print fixed bottom-6 right-6 z-[100] text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-xl"
          style={{ background: toast.kind === "error" ? "#C53030" : "#173F87" }}
        >
          {toast.kind === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}
