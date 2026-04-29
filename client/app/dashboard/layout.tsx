'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

// ─── Page title resolver ──────────────────────────────────────────────────────

function resolveTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard/sales'))        return 'Sales — Lead Tracker';
  if (pathname.startsWith('/dashboard/sanction'))     return 'Sanction — Loan Approvals';
  if (pathname.startsWith('/dashboard/disbursement')) return 'Disbursement';
  if (pathname.startsWith('/dashboard/collection'))   return 'Collection — Repayments';
  return 'Dashboard';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main column ──────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
        <Topbar
          title={resolveTitle(pathname)}
          onMobileMenuToggle={() => setMobileOpen((v) => !v)}
        />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}