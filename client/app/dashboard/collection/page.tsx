'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, post } from '@/lib/api';
import type { Loan, TableColumn, PaginatedResponse, RecordPaymentPayload, RecordPaymentResponse } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanRow = Loan & Record<string, unknown>;

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

// ─── Payment form validation ──────────────────────────────────────────────────

function validatePaymentForm(
  form: PaymentForm,
  outstanding: number
): PaymentFormErrors {
  const errors: PaymentFormErrors = {};

  if (!form.utrNumber.trim()) {
    errors.utrNumber = 'UTR number is required.';
  } else if (form.utrNumber.trim().length < 6) {
    errors.utrNumber = 'UTR number must be at least 6 characters.';
  }

  const amt = Number(form.amount);
  if (!form.amount) {
    errors.amount = 'Amount is required.';
  } else if (isNaN(amt) || amt <= 0) {
    errors.amount = 'Enter a valid amount.';
  } else if (amt > outstanding) {
    errors.amount = `Amount cannot exceed outstanding balance of ${formatCurrency(outstanding)}.`;
  }

  if (!form.paymentDate) {
    errors.paymentDate = 'Payment date is required.';
  } else if (new Date(form.paymentDate) > new Date()) {
    errors.paymentDate = 'Payment date cannot be in the future.';
  }

  return errors;
}

// ─── Inline progress bar ──────────────────────────────────────────────────────

function MiniProgress({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  return (
    <div className="min-w-[100px]">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span className="tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

export default function CollectionPage() {
  const { showSuccess, showError } = useToast();

  const [loans, setLoans]         = useState<LoanRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modal, setModal]         = useState<PaymentModal>(MODAL_INIT);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // ── Fetch ─────────────────────────────────────────────────────────

  const fetchLoans = useCallback(async (p: number) => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await get<PaginatedResponse<LoanRow>>(
        `/collection/loans?page=${p}&limit=${PAGE_LIMIT}`
      );
      if (res.data) {
        setLoans(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Could not load loans.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoans(page); }, [fetchLoans, page]);

  // ── Modal handlers ────────────────────────────────────────────────

  function openPaymentModal(loan: LoanRow) {
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

    const outstanding = modal.loan.outstandingBalance;
    const errors = validatePaymentForm(modal.form, outstanding);
    if (Object.keys(errors).length > 0) {
      setModal((prev) => ({ ...prev, errors }));
      return;
    }

    setModal((prev) => ({ ...prev, isSubmitting: true, apiError: '' }));
    try {
      const payload: RecordPaymentPayload = {
        utrNumber:   modal.form.utrNumber.trim(),
        amount:      Number(modal.form.amount),
        paymentDate: modal.form.paymentDate,
      };

      const res = await post<RecordPaymentResponse>(
        `/collection/loans/${modal.loan._id}/payment`,
        payload
      );

      if (res.data?.isClosed) {
        showSuccess('Payment recorded. Loan is now CLOSED! 🎉');
      } else {
        showSuccess('Payment recorded successfully.');
      }

      setModal(MODAL_INIT);
      fetchLoans(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not record payment.';
      setModal((prev) => ({ ...prev, isSubmitting: false, apiError: msg }));
      showError(msg);
    }
  }

  // ── Columns ───────────────────────────────────────────────────────

  const columns: TableColumn<LoanRow>[] = [
    {
      key: 'borrowerEmail',
      label: 'Borrower Email',
      render: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {(row.borrowerId as { email?: string })?.email ?? '—'}
        </span>
      ),
    },
    {
      key: 'fullName',
      label: 'Full Name',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {(row.profileId as { fullName?: string })?.fullName ?? '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Loan Amount',
      render: (row) => (
        <span className="text-sm font-mono tabular-nums font-semibold text-gray-900">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'totalRepayment',
      label: 'Total Repayment',
      render: (row) => (
        <span className="text-sm font-mono tabular-nums text-gray-800">
          {formatCurrency(row.totalRepayment)}
        </span>
      ),
    },
    {
      key: 'totalPaid',
      label: 'Total Paid',
      render: (row) => (
        <span className="text-sm font-mono tabular-nums text-green-700 font-semibold">
          {formatCurrency(row.totalPaid)}
        </span>
      ),
    },
    {
      key: 'outstandingBalance',
      label: 'Outstanding',
      render: (row) => (
        <span className={`text-sm font-mono tabular-nums font-semibold ${
          row.outstandingBalance <= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(row.outstandingBalance)}
        </span>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => (
        <MiniProgress paid={row.totalPaid} total={row.totalRepayment} />
      ),
    },
    {
      key: 'disbursedAt',
      label: 'Disbursed On',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {row.disbursedAt ? formatDate(row.disbursedAt as string) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        row.outstandingBalance > 0 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => openPaymentModal(row)}
            className="whitespace-nowrap"
          >
            Record Payment
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Paid Off
          </span>
        )
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Collection</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Track repayments and record incoming payments for disbursed loans.
          </p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-full font-medium">
            {total} active loan{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="text-sm text-red-700 font-medium">{fetchError}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchLoans(page)}>Retry</Button>
        </div>
      )}

      {/* Table */}
      <Card noPadding>
        <Table<LoanRow>
          columns={columns}
          data={loans}
          isLoading={isLoading}
          emptyMessage="No disbursed loans to collect."
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
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                ← Previous
              </Button>
              <span className="text-xs text-gray-600 font-medium px-2">{page} / {totalPages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Record Payment Modal ────────────────────────────────────── */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title="Record Payment"
        maxWidth="max-w-md"
      >
        {modal.loan && (
          <div className="space-y-5">

            {/* Loan summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-900">
                {(modal.loan.profileId as { fullName?: string })?.fullName ??
                 (modal.loan.borrowerId as { email?: string })?.email}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-gray-500">Loan Amount: </span>
                  <span className="font-mono font-medium">{formatCurrency(modal.loan.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Paid: </span>
                  <span className="font-mono font-medium text-green-700">{formatCurrency(modal.loan.totalPaid)}</span>
                </div>
              </div>
              {/* Outstanding highlighted */}
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-red-700">Outstanding Balance</span>
                <span className="text-sm font-mono font-bold text-red-700 tabular-nums">
                  {formatCurrency(modal.loan.outstandingBalance)}
                </span>
              </div>

              {/* Repayment progress */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Repaid</span>
                  <span className="tabular-nums">
                    {modal.loan.totalRepayment > 0
                      ? ((modal.loan.totalPaid / modal.loan.totalRepayment) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: `${modal.loan.totalRepayment > 0
                        ? Math.min((modal.loan.totalPaid / modal.loan.totalRepayment) * 100, 100)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Form fields ───────────────────────────────────────── */}

            {/* UTR Number */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="utr">
                UTR Number <span className="text-red-500">*</span>
              </label>
              <input
                id="utr"
                type="text"
                value={modal.form.utrNumber}
                onChange={(e) => handleFormChange('utrNumber', e.target.value)}
                placeholder="e.g. UTR123456789012"
                disabled={modal.isSubmitting}
                className={[
                  'w-full text-sm font-mono border rounded-lg px-3 py-2',
                  'focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-gray-50',
                  modal.errors.utrNumber
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                ].join(' ')}
              />
              {modal.errors.utrNumber && (
                <p className="text-xs text-red-600">{modal.errors.utrNumber}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="pay-amount">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">₹</span>
                <input
                  id="pay-amount"
                  type="number"
                  value={modal.form.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  placeholder="0"
                  min="1"
                  max={modal.loan.outstandingBalance}
                  disabled={modal.isSubmitting}
                  className={[
                    'w-full text-sm pl-7 border rounded-lg px-3 py-2',
                    'focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-gray-50',
                    modal.errors.amount
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                  ].join(' ')}
                />
              </div>
              {modal.errors.amount ? (
                <p className="text-xs text-red-600">{modal.errors.amount}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Max: <span className="font-mono font-medium text-gray-700">
                    {formatCurrency(modal.loan.outstandingBalance)}
                  </span>
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="pay-date">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                id="pay-date"
                type="date"
                value={modal.form.paymentDate}
                max={todayStr()}
                onChange={(e) => handleFormChange('paymentDate', e.target.value)}
                disabled={modal.isSubmitting}
                className={[
                  'w-full text-sm border rounded-lg px-3 py-2',
                  'focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-gray-50',
                  modal.errors.paymentDate
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                ].join(' ')}
              />
              {modal.errors.paymentDate && (
                <p className="text-xs text-red-600">{modal.errors.paymentDate}</p>
              )}
            </div>

            {/* API error */}
            {modal.apiError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700">{modal.apiError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
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