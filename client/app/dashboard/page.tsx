'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageSpinner } from '@/components/ui/Spinner';
import type { User } from '@/types';

// ─── Role → module mapping ────────────────────────────────────────────────────

function getDefaultRoute(role: User['role']): string {
  switch (role) {
    case 'admin':        return '/dashboard/sales';
    case 'sales':        return '/dashboard/sales';
    case 'sanction':     return '/dashboard/sanction';
    case 'disbursement': return '/dashboard/disbursement';
    case 'collection':   return '/dashboard/collection';
    default:             return '/login';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardIndexPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDefaultRoute(user.role));
    } else if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  return <PageSpinner />;
}