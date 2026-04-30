'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { get } from '@/lib/api';
import type { Lead, PaginatedResponse, TableColumn } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

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
    render: (row) => <span className="text-sm font-medium text-gray-900">{row.email}</span>,
  },
  {
    key: 'fullName',
    label: 'Full Name',
    render: (row) => <span className="text-sm text-gray-700">{row.profile?.fullName ?? '-'}</span>,
  },
  {
    key: 'employmentMode',
    label: 'Employment Mode',
    render: (row) => (
      <span className="text-sm text-gray-700 capitalize">
        {row.profile?.employmentMode?.replace('-', ' ') ?? '-'}
      </span>
    ),
  },
  {
    key: 'monthlySalary',
    label: 'Monthly Salary',
    render: (row) => (
      <span className="text-sm font-mono text-gray-800">
        {row.profile?.monthlySalary != null ? formatCurrency(row.profile.monthlySalary) : '-'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Registered On',
    render: (row) => <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>,
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
    setIsLoading(true);
    setError('');

    try {
      const response = await get<PaginatedResponse<Lead>>(
        `/sales/leads?page=${nextPage}&limit=${PAGE_LIMIT}`
      );
      const data = response.data;

      setLeads(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setPage(data?.page ?? nextPage);
      setTotalPages(Math.max(1, data?.totalPages ?? 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load leads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(page);
  }, [fetchLeads, page]);

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lead Tracker</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Borrowers who have not applied for a loan yet.
          </p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {total} lead{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchLeads(page)}>
            Retry
          </Button>
        </div>
      )}

      <Card noPadding>
        <Table<Lead>
          columns={columns}
          data={leads}
          isLoading={isLoading}
          emptyMessage="No leads registered yet."
          skeletonRows={PAGE_LIMIT}
          keyExtractor={(row) => row._id}
        />

        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-wrap gap-3">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_LIMIT + 1}-{Math.min(page * PAGE_LIMIT, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="text-xs text-gray-600 font-medium px-2">{page} / {totalPages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
