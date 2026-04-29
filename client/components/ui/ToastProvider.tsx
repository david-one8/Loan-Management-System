'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import type { ToastMessage, ToastType } from '@/types';

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be used within <ToastProvider>');
  return ctx;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') {
    return (
      <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── Color map ────────────────────────────────────────────────────────────────

const bgMap: Record<ToastType, string> = {
  success: 'bg-green-600',
  error:   'bg-red-600',
  info:    'bg-gray-800',
};

// ─── Provider ────────────────────────────────────────────────────────────────

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
      const timer = setTimeout(() => dismiss(id), 3500);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const showSuccess = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast]
  );

  const showError = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={[
              'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white',
              'pointer-events-auto',
              bgMap[toast.type],
              'animate-in slide-in-from-right-4 fade-in duration-200',
            ].join(' ')}
            style={{ animation: 'toastIn 0.2s ease-out' }}
          >
            <ToastIcon type={toast.type} />
            <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 p-0.5 rounded-md hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
    </ToastContext.Provider>
  );
}