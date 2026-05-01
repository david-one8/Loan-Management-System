'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

function resolveTitle(pathname: string): string {
  if (pathname.startsWith('/dashboard/sales')) return 'Sales - Lead Tracker';
  if (pathname.startsWith('/dashboard/sanction')) return 'Sanction - Loan Approvals';
  if (pathname.startsWith('/dashboard/disbursement')) return 'Disbursement';
  if (pathname.startsWith('/dashboard/collection')) return 'Collection - Repayments';
  return 'Dashboard';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0A0F1E]">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="ml-0 flex min-w-0 flex-1 flex-col overflow-hidden md:ml-64">
        <Topbar
          title={resolveTitle(pathname)}
          onMobileMenuToggle={() => setMobileOpen((v) => !v)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
