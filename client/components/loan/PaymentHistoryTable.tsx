import React from 'react';
import type { Payment, TableColumn } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentHistoryTableProps {
  payments: Payment[];
  isLoading?: boolean;
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: TableColumn<Payment>[] = [
  {
    key: 'utrNumber',
    label: 'UTR Number',
    render: (row) => (
      <span className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
        {row.utrNumber}
      </span>
    ),
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (row) => (
      <span className="font-mono font-semibold text-green-700">
        {formatCurrency(row.amount)}
      </span>
    ),
  },
  {
    key: 'paymentDate',
    label: 'Payment Date',
    render: (row) => (
      <span className="text-sm text-gray-700">{formatDate(row.paymentDate)}</span>
    ),
  },
  {
    key: 'recordedBy',
    label: 'Recorded By',
    render: (row) => (
      <span className="text-sm text-gray-600">
        {typeof row.recordedBy === 'object' && row.recordedBy !== null
          ? (row.recordedBy as { email: string }).email
          : '—'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Recorded On',
    render: (row) => (
      <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentHistoryTable({
  payments,
  isLoading = false,
}: PaymentHistoryTableProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
          />
        </svg>
        <h3 className="text-base font-semibold text-gray-800">
          Payment History
        </h3>
        {!isLoading && payments.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">
            {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <Table<Payment>
          columns={columns as TableColumn<Record<string, unknown>>[]}
          data={payments as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          emptyMessage="No payments recorded yet."
          keyExtractor={(row) => (row as unknown as Payment)._id}
        />
      </div>
    </div>
  );
}