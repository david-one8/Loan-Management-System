'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';
import Badge from '@/components/ui/Badge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  roles: User['role'][];
  icon: React.ReactNode;
}

// ─── Icons (inline SVG to avoid any icon library dep) ────────────────────────

const icons = {
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  banknotes: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
    </svg>
  ),
  collection: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

// ─── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Sales',
    href: '/dashboard/sales',
    roles: ['admin', 'sales'],
    icon: icons.users,
  },
  {
    label: 'Sanction',
    href: '/dashboard/sanction',
    roles: ['admin', 'sanction'],
    icon: icons.checkCircle,
  },
  {
    label: 'Disbursement',
    href: '/dashboard/disbursement',
    roles: ['admin', 'disbursement'],
    icon: icons.banknotes,
  },
  {
    label: 'Collection',
    href: '/dashboard/collection',
    roles: ['admin', 'collection'],
    icon: icons.collection,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

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
    <aside className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 shrink-0">
        {/* LMS Logo mark */}
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
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">LMS</p>
          <p className="text-xs text-gray-500 leading-tight">Operations Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
        <ul className="space-y-1" role="list">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-colors duration-150',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={active ? 'text-blue-600' : 'text-gray-400'}
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

      {/* User footer */}
      {user && (
        <div className="px-3 py-4 border-t border-gray-200 shrink-0">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
              {getInitials(user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user.email}
              </p>
              <div className="mt-0.5">
                <Badge status={user.role} />
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
          >
            <span aria-hidden="true">{icons.logout}</span>
            Log out
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:flex lg:flex-col lg:h-full">{sidebarContent}</div>

      {/* Mobile sidebar — slide in over content */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
