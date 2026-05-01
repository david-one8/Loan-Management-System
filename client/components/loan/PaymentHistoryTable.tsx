import { Receipt } from 'lucide-react';
import type { Payment, TableColumn } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';

interface PaymentHistoryTableProps {
  payments: Payment[];
  isLoading?: boolean;
}

const columns: TableColumn<Payment>[] = [
  {
    key: 'utrNumber',
    label: 'UTR Number',
    render: (row) => (
      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-300">
        {row.utrNumber}
      </span>
    ),
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (row) => (
      <span className="font-mono font-semibold text-success-700 dark:text-success-400">
        {formatCurrency(row.amount)}
      </span>
    ),
  },
  {
    key: 'paymentDate',
    label: 'Payment Date',
    render: (row) => (
      <span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(row.paymentDate)}</span>
    ),
  },
  {
    key: 'recordedBy',
    label: 'Recorded By',
    render: (row) => (
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {typeof row.recordedBy === 'object' && row.recordedBy !== null
          ? (row.recordedBy as { email: string }).email
          : '-'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Recorded On',
    render: (row) => (
      <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(row.createdAt)}</span>
    ),
  },
];

export default function PaymentHistoryTable({
  payments,
  isLoading = false,
}: PaymentHistoryTableProps) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-success-600 dark:text-success-400" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Payment History
        </h3>
        {!isLoading && payments.length > 0 && (
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
            {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Table<Payment>
        columns={columns}
        data={payments}
        isLoading={isLoading}
        emptyMessage="No payments recorded yet."
        keyExtractor={(row) => row._id}
      />
    </div>
  );
}
