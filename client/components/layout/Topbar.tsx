'use client';

import {
  Bell,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface TopbarProps {
  title: string;
  onMobileMenuToggle?: () => void;
  actions?: React.ReactNode;
}

export default function Topbar({ title, onMobileMenuToggle, actions }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl md:px-6 dark:border-[#1e293b] dark:bg-[#0A0F1E]/80">
      <div className="flex min-w-0 items-center gap-3">
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            aria-label="Toggle navigation menu"
            className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions && <div className="hidden items-center gap-2 sm:flex">{actions}</div>}

        <ThemeToggle />

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-danger-500 dark:border-slate-800" />
        </button>

        {user && (
          <>
            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />
            <div className="flex cursor-default items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">
                {getInitials(user.email)}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 md:block dark:text-slate-300">
                {user.email}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
