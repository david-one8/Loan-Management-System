'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get } from '@/lib/api';
import type { Lead, TableColumn, PaginatedResponse } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadRow = Record<string, unknown> & {
  _id: string;
  email: string;
  createdAt: string;
  profile?: {
    fullName?: string;
    employmentMode?: string;
    monthlySalary?: number;
    breStatus?: string;
  };
};

// ─── Profile status helper ────────────────────────────────────────────────────

function getProfileStatus(lead: LeadRow): string {
  if (!lead.profile) return 'No Profile';
  if (lead.profile.breStatus === 'failed') return 'BRE Failed';
  if (lead.profile.breStatus === 'passed' || lead.profile.fullName) return 'Profile Complete';
  return 'No Profile';
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: TableColumn<LeadRow>[] = [
  {
    key: 'email',
    label: 'Email',
    render: (row) => (
      <span className="text-sm font-medium text-gray-900">{row.email}</span>
    ),
  },
  {
    key: 'fullName',
    label: 'Full Name',
    render: (row) => (
      <span className="text-sm text-gray-700">
        {row.profile?.fullName ?? <span className="text-gray-400">—</span>}
      </span>
    ),
  },
  {
    key: 'employmentMode',
    label: 'Employment Mode',
    render: (row) => (
      <span className="text-sm text-gray-700 capitalize">
        {row.profile?.employmentMode?.replace('-', ' ') ?? (
          <span className="text-gray-400">—</span>
        )}
      </span>
    ),
  },
  {
    key: 'monthlySalary',
    label: 'Monthly Salary',
    render: (row) => (
      <span className="text-sm font-mono text-gray-800 tabular-nums">
        {row.profile?.monthlySalary != null
          ? formatCurrency(row.profile.monthlySalary)
          : <span className="text-gray-400">—</span>}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Registered On',
    render: (row) => (
      <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>
    ),
  },
  {
    key: 'profileStatus',
    label: 'Profile Status',
    render: (row) => <Badge status={getProfileStatus(row)} />,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

export default function SalesPage() {
  const [leads, setLeads]         = useState<LeadRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const fetchLeads = useCallback(async (p: number) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await get<PaginatedResponse<LeadRow>>(
        `/sales/leads?page=${p}&limit=${PAGE_LIMIT}`
      );
      if (res.data) {
        setLeads(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load leads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(page); }, [fetchLeads, page]);

  function handlePageChange(next: number) {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  }

  return (
    <div className="space-y-6 max-w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lead Tracker</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            All registered borrowers and their profile completion status.
          </p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {total} lead{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchLeads(page)}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <Card noPadding>
        <Table<LeadRow>
          columns={columns}
          data={leads}
          isLoading={isLoading}
          emptyMessage="No leads registered yet."
          skeletonRows={PAGE_LIMIT}
          keyExtractor={(row) => row._id}
        />

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 flex-wrap gap-3">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * PAGE_LIMIT) + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                ← Previous
              </Button>
              <span className="text-xs text-gray-600 font-medium px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}