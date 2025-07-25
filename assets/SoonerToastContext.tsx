import { createContext } from "react";

// Toast type
export type Toast = {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  position?:string;
};

// Context type
export interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
}

// Context
// Initialize context with 'null' instead of 'undefined'
export const SoonerToastContext = createContext<ToastContextType | null>(null);
