'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import StepProgressBar from '@/components/layout/StepProgressBar';
import type { ApplyStep } from '@/types';
import { getInitials } from '@/lib/utils';

// ─── Step resolver ────────────────────────────────────────────────────────────

function resolveStep(pathname: string): ApplyStep | null {
  if (pathname.startsWith('/apply/personal')) return 1;
  if (pathname.startsWith('/apply/upload'))   return 2;
  if (pathname.startsWith('/apply/loan'))     return 3;
  return null; // /apply/status has no step bar
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const { user, logout } = useAuth();
  const step = resolveStep(pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top nav bar ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">LMS</span>
          </div>

          {/* Right: avatar + logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]">
                  {user.email}
                </span>
                <span className="text-xs text-gray-400 capitalize">{user.role}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
                {getInitials(user.email)}
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Step progress bar (only on steps 1-3) ──────────────────── */}
      {step !== null && (
        <div className="bg-white border-b border-gray-200 shrink-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
            <StepProgressBar currentStep={step} />
          </div>
        </div>
      )}

      {/* ── Page content ───────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="shrink-0 py-4 text-center text-xs text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} LMS — Loan Management System. All rights reserved.
      </footer>
    </div>
  );
}