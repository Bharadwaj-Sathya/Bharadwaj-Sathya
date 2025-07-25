"use client";

import { useState, useCallback, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { v4 as uuidv4 } from "uuid";
import { SoonerToastContext, type Toast } from "./SoonerToastContext";

// Provider
export const SoonerToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { theme = "system" } = useTheme();

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = uuidv4();
    const toastWithId = { ...toast, id };
    setToasts((prev) => [...prev, toastWithId]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 3000);
  }, []);

  return (
    <SoonerToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`w-72 border px-4 py-3 rounded-lg shadow-lg ${
                theme === "dark"
                  ? "bg-neutral-800 text-white border-neutral-700"
                  : "bg-white text-black border-neutral-300"
              }`}
            >
              <div className="font-semibold">{toast.title}</div>
              {toast.description && (
                <div className="text-sm text-gray-500 mt-1">
                  {toast.description}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SoonerToastContext.Provider>
  );
};
