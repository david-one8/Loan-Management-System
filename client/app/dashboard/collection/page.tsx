'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Receipt, Search } from 'lucide-react';
import { get, post } from '@/lib/api';
import type {
  Loan,
  PaginatedResponse,
  RecordPaymentPayload,
  RecordPaymentResponse,
  TableColumn,
} from '@/types';
import { formatCurrency } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';
import PageHeader from '@/components/ui/PageHeader';
import ProgressBar from '@/components/ui/ProgressBar';

const PAGE_LIMIT = 10;

type LoanRow = Loan;

interface PaymentForm {
  utrNumber: string;
  amount: string;
  paymentDate: string;
}

interface PaymentFormErrors {
  utrNumber?: string;
  amount?: string;
  paymentDate?: string;
}

interface PaymentModal {
  isOpen: boolean;
  loan: LoanRow | null;
  form: PaymentForm;
  errors: PaymentFormErrors;
  isSubmitting: boolean;
  apiError: string;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

const MODAL_INIT: PaymentModal = {
  isOpen: false,
  loan: null,
  form: { utrNumber: '', amount: '', paymentDate: todayStr() },
  errors: {},
  isSubmitting: false,
  apiError: '',
};

function validatePaymentForm(form: PaymentForm, outstanding: number): PaymentFormErrors {
  const errors: PaymentFormErrors = {};
  const amount = Number(form.amount);

  if (!form.utrNumber.trim()) {
    errors.utrNumber = 'UTR number is required.';
  }

  if (!form.amount) {
    errors.amount = 'Amount is required.';
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.amount = 'Enter a valid amount.';
  } else if (amount > outstanding) {
    errors.amount = `Amount cannot exceed outstanding balance of ${formatCurrency(outstanding)}.`;
  }

  if (!form.paymentDate) {
    errors.paymentDate = 'Payment date is required.';
  } else if (new Date(form.paymentDate) > new Date()) {
    errors.paymentDate = 'Payment date cannot be in the future.';
  }

  return errors;
}

function MiniProgress({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

  return (
    <div className="min-w-40">
      <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{pct.toFixed(1)}%</span>
        <span>{formatCurrency(paid)}</span>
      </div>
      <ProgressBar value={Number(pct.toFixed(1))} size="sm" variant={pct >= 100 ? 'success' : 'gradient'} />
    </div>
  );
}

export default function CollectionPage() {
  const { showSuccess, showError } = useToast();

  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modal, setModal] = useState<PaymentModal>(MODAL_INIT);

  const fetchLoans = useCallback(async (nextPage: number) => {
    try {
      const response = await get<PaginatedResponse<LoanRow>>(
        `/collection/loans?page=${nextPage}&limit=${PAGE_LIMIT}`
      );
      const data = response.data;

      setLoans(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setPage(data?.page ?? nextPage);
      setTotalPages(Math.max(1, data?.totalPages ?? 1));
      setFetchError('');
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Could not load loans.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLoans(page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchLoans, page]);

  function openModal(loan: LoanRow) {
    setModal({
      isOpen: true,
      loan,
      form: { utrNumber: '', amount: '', paymentDate: todayStr() },
      errors: {},
      isSubmitting: false,
      apiError: '',
    });
  }

  function closeModal() {
    if (modal.isSubmitting) return;
    setModal(MODAL_INIT);
  }

  function handleFormChange(field: keyof PaymentForm, value: string) {
    setModal((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
      errors: { ...prev.errors, [field]: undefined },
      apiError: '',
    }));
  }

  async function handleRecordPayment() {
    if (!modal.loan) return;

    const errors = validatePaymentForm(modal.form, modal.loan.outstandingBalance);
    if (Object.keys(errors).length > 0) {
      setModal((prev) => ({ ...prev, errors }));
      return;
    }

    setModal((prev) => ({ ...prev, isSubmitting: true, apiError: '' }));

    try {
      const payload: RecordPaymentPayload = {
        utrNumber: modal.form.utrNumber.trim(),
        amount: Number(modal.form.amount),
        paymentDate: modal.form.paymentDate,
      };
      const response = await post<RecordPaymentResponse>(
        `/collection/loans/${modal.loan._id}/payment`,
        payload
      );
      const result = response.data;

      if (result?.isClosed) {
        showSuccess('Loan Closed!');
      } else {
        showSuccess('Payment recorded successfully.');
      }

      setModal(MODAL_INIT);
      fetchLoans(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not record payment.';
      setModal((prev) => ({ ...prev, isSubmitting: false, apiError: message }));
      showError(message);
    }
  }

  const columns: TableColumn<LoanRow>[] = [
    {
      key: 'borrowerEmail',
      label: 'Borrower Email',
      render: (row) => <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.borrowerId?.email ?? '-'}</span>,
    },
    {
      key: 'fullName',
      label: 'Full Name',
      render: (row) => <span className="text-sm text-slate-700 dark:text-slate-300">{row.profileId?.fullName ?? '-'}</span>,
    },
    {
      key: 'totalRepayment',
      label: 'Total Repayment',
      render: (row) => <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.totalRepayment)}</span>,
    },
    {
      key: 'totalPaid',
      label: 'Total Paid',
      render: (row) => <span className="font-mono text-sm font-semibold text-success-700 dark:text-success-400">{formatCurrency(row.totalPaid)}</span>,
    },
    {
      key: 'outstandingBalance',
      label: 'Outstanding',
      render: (row) => <span className="font-mono text-sm font-semibold text-danger-600 dark:text-danger-400">{formatCurrency(row.outstandingBalance)}</span>,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => <MiniProgress paid={row.totalPaid} total={row.totalRepayment} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        row.outstandingBalance > 0 ? (
          <Button variant="primary" size="sm" onClick={() => openModal(row)}>
            Record Payment
          </Button>
        ) : (
          <span className="rounded-full border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400">
            Closed
          </span>
        ),
    },
  ];

  return (
    <div className="max-w-full space-y-6 animate-fade-up">
      <PageHeader
        title="Collection"
        subtitle="Track repayments and record incoming payments for disbursed loans."
        icon={<Receipt className="h-6 w-6" />}
      />

      {fetchError && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-danger-200 bg-danger-50 px-5 py-4 dark:border-danger-500/20 dark:bg-danger-500/10">
          <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{fetchError}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchLoans(page)}>
            Retry
          </Button>
        </div>
      )}

      <Card noPadding>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#1e293b]">
          <span className="rounded-full border border-success-200 bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400">
            {total} active loan{total !== 1 ? 's' : ''}
          </span>
          <div className="flex w-48 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-400 dark:border-[#1e293b] dark:bg-[#0A0F1E]">
            <Search className="h-4 w-4" />
            Search records...
          </div>
        </div>
        <Table<LoanRow>
          columns={columns}
          data={loans}
          isLoading={isLoading}
          emptyMessage="No disbursed loans awaiting collection."
          skeletonRows={PAGE_LIMIT}
          keyExtractor={(row) => row._id}
        />

        {!isLoading && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-[#1e293b]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * PAGE_LIMIT + 1}-{Math.min(page * PAGE_LIMIT, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400">{page} / {totalPages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={modal.isOpen} onClose={closeModal} title="Record Payment" maxWidth="max-w-lg">
        {modal.loan && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/50">
              <span className="text-sm font-medium text-brand-700 dark:text-brand-400">Outstanding balance</span>
              <span className="font-mono text-2xl font-bold tabular-nums text-brand-600 dark:text-brand-400">{formatCurrency(modal.loan.outstandingBalance)}</span>
            </div>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-[#1e293b] dark:bg-[#0A0F1E]">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Borrower</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{modal.loan.profileId?.fullName ?? modal.loan.borrowerId?.email}</span>
              </div>
              <MiniProgress paid={modal.loan.totalPaid} total={modal.loan.totalRepayment} />
            </div>

            {Number(modal.form.amount) === modal.loan.outstandingBalance && (
              <div className="flex animate-fade-up items-center gap-3 rounded-xl border border-success-200 bg-success-50 p-3 dark:border-success-500/20 dark:bg-success-500/10">
                <CheckCircle2 className="h-5 w-5 text-success-600 dark:text-success-400" />
                <span className="text-sm font-medium text-success-700 dark:text-success-400">This payment will close the loan</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="utrNumber">UTR Number</label>
              <input
                id="utrNumber"
                value={modal.form.utrNumber}
                onChange={(e) => handleFormChange('utrNumber', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#1e293b] dark:bg-[#0d1526] dark:text-slate-100"
                disabled={modal.isSubmitting}
              />
              {modal.errors.utrNumber && <p className="text-xs text-danger-600 dark:text-danger-400">{modal.errors.utrNumber}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                value={modal.form.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                max={modal.loan.outstandingBalance}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#1e293b] dark:bg-[#0d1526] dark:text-slate-100"
                disabled={modal.isSubmitting}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Outstanding balance: {formatCurrency(modal.loan.outstandingBalance)}</p>
              {modal.errors.amount && <p className="text-xs text-danger-600 dark:text-danger-400">{modal.errors.amount}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="paymentDate">Payment Date</label>
              <input
                id="paymentDate"
                type="date"
                value={modal.form.paymentDate}
                onChange={(e) => handleFormChange('paymentDate', e.target.value)}
                max={todayStr()}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#1e293b] dark:bg-[#0d1526] dark:text-slate-100"
                disabled={modal.isSubmitting}
              />
              {modal.errors.paymentDate && <p className="text-xs text-danger-600 dark:text-danger-400">{modal.errors.paymentDate}</p>}
            </div>

            {modal.apiError && (
              <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 dark:border-danger-500/20 dark:bg-danger-500/10">
                <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{modal.apiError}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeModal} disabled={modal.isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleRecordPayment}
                isLoading={modal.isSubmitting}
                disabled={modal.isSubmitting}
              >
                Record Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
