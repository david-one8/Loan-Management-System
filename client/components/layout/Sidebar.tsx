'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  ClipboardCheck,
  LogOut,
  Receipt,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';

interface NavItem {
  label: string;
  href: string;
  roles: User['role'][];
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Sales',
    href: '/dashboard/sales',
    roles: ['admin', 'sales'],
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Sanction',
    href: '/dashboard/sanction',
    roles: ['admin', 'sanction'],
    icon: <ClipboardCheck className="h-5 w-5" />,
  },
  {
    label: 'Disbursement',
    href: '/dashboard/disbursement',
    roles: ['admin', 'disbursement'],
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    label: 'Collection',
    href: '/dashboard/collection',
    roles: ['admin', 'collection'],
    icon: <Receipt className="h-5 w-5" />,
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/');
  }

  const sidebarContent = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-[#1e293b] dark:bg-[#0A0F1E]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#1e293b]">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-sm font-bold text-white shadow-sm">
          L
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-50">LMS</p>
          <p className="text-2xs leading-tight text-slate-400 dark:text-slate-600">
            Loan Management
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto" aria-label="Main navigation">
        <p className="px-4 pb-2 pt-5 text-2xs font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-600">
          Modules
        </p>
        <ul className="space-y-0.5 px-3" role="list">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={[
                    'relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#1a2236] dark:hover:text-slate-200',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && (
                    <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                  )}
                  <span
                    className={[
                      'flex-shrink-0 transition-colors',
                      active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-600',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div className="mt-auto border-t border-slate-100 p-3 dark:border-[#1e293b]">
          <div className="mb-1 flex cursor-default items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2236]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
              {getInitials(user.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.email.split('@')[0]}
              </p>
              <p className="text-2xs capitalize text-slate-400 dark:text-slate-600">
                {user.role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-danger-50 hover:text-danger-600 dark:text-slate-400 dark:hover:bg-danger-500/10 dark:hover:text-danger-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col">
        {sidebarContent}
      </div>

      <div
        className={[
          'fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <div
        className={[
          'fixed inset-y-0 left-0 z-40 flex transform flex-col transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebarContent}
      </div>
    </>
  );
}
