"use client";

import { create } from "zustand";
import { Alert } from "./alert";

interface ToastState {
  message: string | null;
  type: "success" | "error";
  show: boolean;
  showToast: (message: string, type: "success" | "error") => void;
  hideToast: () => void;
}

const useToast = create<ToastState>((set) => ({
  message: null,
  type: "success",
  show: false,
  showToast: (message, type) => {
    set({ message, type, show: true });
    setTimeout(() => {
      set({ show: false });
    }, 5000);
  },
  hideToast: () => set({ show: false }),
}));

export function GlobalToast() {
  const { message, type, show, hideToast } = useToast();

  if (!show || !message) return null;

  return (
    <div
      data-testid="operation-alert"
      className="pointer-events-none fixed top-4 right-0 left-0 z-50"
    >
      <div className="mx-auto max-w-2xl">
        <Alert
          variant={type}
          onDismiss={hideToast}
          className="animate-in fade-in slide-in-from-top-4 pointer-events-auto transition-all duration-300 ease-in-out"
        >
          <span data-testid="toast-message">{message}</span>
          <button
            onClick={hideToast}
            className="absolute top-2 right-2 opacity-70 hover:opacity-100 focus:opacity-100"
            aria-label="关闭提示"
            data-testid="close-toast"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6L18 18" />
            </svg>
          </button>
        </Alert>
      </div>
    </div>
  );
}

export { useToast };
