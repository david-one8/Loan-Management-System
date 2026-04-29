'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopbarProps {
  title: string;
  onMobileMenuToggle?: () => void;
  /** Slot for extra controls (e.g. buttons) on the right */
  actions?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Topbar({ title, onMobileMenuToggle, actions }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle */}
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Page title */}
        <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
      </div>

      {/* Right: action slot + user avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

        {/* User avatar */}
        {user && (
          <div
            className="relative group"
            title={`${user.email} · ${user.role}`}
          >
            <div
              aria-label={`Logged in as ${user.email}`}
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-default select-none ring-2 ring-offset-1 ring-transparent group-hover:ring-blue-200 transition-all"
            >
              {getInitials(user.email)}
            </div>

            {/* Hover tooltip */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-3 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 pointer-events-none">
              <p className="text-xs font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}