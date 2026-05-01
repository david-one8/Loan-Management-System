'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import StepProgressBar from '@/components/layout/StepProgressBar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import type { ApplyStep } from '@/types';
import { getInitials } from '@/lib/utils';

function resolveStep(pathname: string): ApplyStep | null {
  if (pathname.startsWith('/apply/personal')) return 1;
  if (pathname.startsWith('/apply/upload')) return 2;
  if (pathname.startsWith('/apply/loan')) return 3;
  return null;
}

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const step = resolveStep(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#0A0F1E]">
      <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-[#1e293b] dark:bg-[#0A0F1E]/80">
        <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-sm font-bold text-white shadow-sm">
              L
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-50">LMS</span>
          </div>

          {step !== null && (
            <div className="hidden flex-1 justify-center md:flex">
              <div className="w-full max-w-xl">
                <StepProgressBar currentStep={step} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <>
                <div className="hidden flex-col items-end sm:flex">
                  <span className="max-w-[160px] truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                    {user.email}
                  </span>
                  <span className="text-xs capitalize text-slate-400 dark:text-slate-600">
                    {user.role}
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">
                  {getInitials(user.email)}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  aria-label="Sign out"
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {step !== null && (
        <div className="shrink-0 border-b border-slate-200 bg-white md:hidden dark:border-[#1e293b] dark:bg-[#0A0F1E]">
          <StepProgressBar currentStep={step} />
        </div>
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 md:py-10">
        <div className="animate-fade-up">{children}</div>
      </main>

      <footer className="shrink-0 border-t border-slate-100 py-4 text-center text-xs text-slate-400 dark:border-[#1e293b] dark:text-slate-600">
        LMS - Loan Management System
      </footer>
    </div>
  );
}
