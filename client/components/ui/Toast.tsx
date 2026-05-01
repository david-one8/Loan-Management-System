'use client';

import {
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastMethods {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

interface ToastContextValue {
  toast: ToastMethods;
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be used within <ToastProvider>');
  return ctx;
}

const accentMap: Record<ToastType, string> = {
  success: 'bg-success-500',
  error: 'bg-danger-500',
  info: 'bg-brand-500',
};

const iconMap: Record<ToastType, React.ReactNode> = {
  success: (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
      <CheckCircle2 className="h-4 w-4 text-success-600 dark:text-success-500" />
    </span>
  ),
  error: (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-500/10">
      <XCircle className="h-4 w-4 text-danger-600 dark:text-danger-500" />
    </span>
  ),
  info: (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
      <Info className="h-4 w-4 text-brand-600 dark:text-brand-400" />
    </span>
  ),
};

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

  const pushToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
      const timer = setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const toast = {
    success: (title: string, message?: string) => pushToast('success', title, message),
    error: (title: string, message?: string) => pushToast('error', title, message),
    info: (title: string, message?: string) => pushToast('info', title, message),
  };

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => pushToast(type, message),
    [pushToast]
  );

  const showSuccess = useCallback(
    (message: string) => pushToast('success', message),
    [pushToast]
  );

  const showError = useCallback(
    (message: string) => pushToast('error', message),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={{ toast, showToast, showSuccess, showError }}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 top-4 z-[200] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card-lg animate-slide-in-right dark:border-[#1e293b] dark:bg-[#1a2236]"
          >
            <div className={`absolute inset-y-0 left-0 w-1 ${accentMap[item.type]}`} />
            <div className="flex items-start gap-3 px-4 py-3.5 pl-5 pr-10">
              {iconMap[item.type]}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </p>
                {item.message && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.message}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
            <div className={`h-0.5 animate-toast-progress ${accentMap[item.type]}`} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
