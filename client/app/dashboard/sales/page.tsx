'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { get } from '@/lib/api';
import type { Lead, PaginatedResponse, TableColumn } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';

const PAGE_LIMIT = 10;

function getProfileStatus(lead: Lead): string {
  if (!lead.profile) return 'No Profile';
  if (lead.profile.breStatus === 'failed') return 'BRE Failed';
  if (lead.profile.breStatus === 'passed' || lead.profile.fullName) return 'Profile Complete';
  return 'No Profile';
}

const columns: TableColumn<Lead>[] = [
  {
    key: 'email',
    label: 'Email',
    render: (row) => <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.email}</span>,
  },
  {
    key: 'fullName',
    label: 'Full Name',
    render: (row) => <span className="text-sm text-slate-700 dark:text-slate-300">{row.profile?.fullName ?? '-'}</span>,
  },
  {
    key: 'employmentMode',
    label: 'Employment Mode',
    render: (row) => (
      <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
        {row.profile?.employmentMode?.replace('-', ' ') ?? '-'}
      </span>
    ),
  },
  {
    key: 'monthlySalary',
    label: 'Monthly Salary',
    render: (row) => (
      <span className="font-mono text-sm text-slate-800 dark:text-slate-200">
        {row.profile?.monthlySalary != null ? formatCurrency(row.profile.monthlySalary) : '-'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Registered On',
    render: (row) => <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(row.createdAt)}</span>,
  },
  {
    key: 'profileStatus',
    label: 'Profile Status',
    render: (row) => <Badge status={getProfileStatus(row)} />,
  },
];

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = useCallback(async (nextPage: number) => {
    try {
      const response = await get<PaginatedResponse<Lead>>(
        `/sales/leads?page=${nextPage}&limit=${PAGE_LIMIT}`
      );
      const data = response.data;

      setLeads(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setPage(data?.page ?? nextPage);
      setTotalPages(Math.max(1, data?.totalPages ?? 1));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load leads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLeads(page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchLeads, page]);

  return (
    <div className="max-w-full space-y-6 animate-fade-up">
      <PageHeader
        title="Lead Tracker"
        subtitle="Borrowers who have not applied for a loan yet."
        icon={<Users className="h-6 w-6" />}
      />

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-danger-200 bg-danger-50 px-5 py-4 dark:border-danger-500/20 dark:bg-danger-500/10">
          <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchLeads(page)}>
            Retry
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#1e293b]">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {total} record{total !== 1 ? 's' : ''}
          </span>
          <div className="flex w-48 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-400 dark:border-[#1e293b] dark:bg-[#0A0F1E]">
            <Search className="h-4 w-4" />
            Search records...
          </div>
        </div>
        <Table<Lead>
          columns={columns}
          data={leads}
          isLoading={isLoading}
          emptyMessage="No leads registered yet."
          skeletonRows={PAGE_LIMIT}
          keyExtractor={(row) => row._id}
        />

        {!isLoading && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 dark:border-[#1e293b]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * PAGE_LIMIT + 1}-{Math.min(page * PAGE_LIMIT, total)} of {total} results
            </p>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white">{page} / {totalPages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
