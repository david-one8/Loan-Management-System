'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, patch } from '@/lib/api';
import type { Loan, TableColumn, PaginatedResponse } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanRow = Loan & Record<string, unknown>;

interface ConfirmModal {
  isOpen: boolean;
  loan: LoanRow | null;
  isSubmitting: boolean;
  error: string;
}

const MODAL_INIT: ConfirmModal = { isOpen: false, loan: null, isSubmitting: false, error: '' };

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

export default function DisbursementPage() {
  const { showSuccess, showError } = useToast();

  const [loans, setLoans]         = useState<LoanRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modal, setModal]         = useState<ConfirmModal>(MODAL_INIT);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // ── Fetch ─────────────────────────────────────────────────────────

  const fetchLoans = useCallback(async (p: number) => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await get<PaginatedResponse<LoanRow>>(
        `/disbursement/loans?page=${p}&limit=${PAGE_LIMIT}`
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

  // ── Disburse action ───────────────────────────────────────────────

  function openModal(loan: LoanRow) {
    setModal({ isOpen: true, loan, isSubmitting: false, error: '' });
  }

  function closeModal() {
    if (modal.isSubmitting) return;
    setModal(MODAL_INIT);
  }

  async function handleDisburse() {
    if (!modal.loan) return;
    setModal((prev) => ({ ...prev, isSubmitting: true, error: '' }));
    try {
      await patch(`/disbursement/loans/${modal.loan._id}/disburse`, {});
      showSuccess('Loan marked as disbursed.');
      setModal(MODAL_INIT);
      fetchLoans(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Disbursement failed.';
      setModal((prev) => ({ ...prev, isSubmitting: false, error: msg }));
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
        <span className="text-sm font-mono font-semibold tabular-nums text-gray-900">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'totalRepayment',
      label: 'Total Repayment',
      render: (row) => (
        <span className="text-sm font-mono tabular-nums text-blue-700 font-semibold">
          {formatCurrency(row.totalRepayment)}
        </span>
      ),
    },
    {
      key: 'sanctionedAt',
      label: 'Sanctioned On',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {row.sanctionedAt ? formatDate(row.sanctionedAt as string) : '—'}
        </span>
      ),
    },
    {
      key: 'sanctionRemark',
      label: 'Sanction Remark',
      render: (row) => (
        <span className="text-sm text-gray-600 max-w-[200px] truncate block">
          {(row.sanctionRemark as string) || <span className="text-gray-400">—</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => openModal(row)}
          className="whitespace-nowrap"
        >
          Mark Disbursed
        </Button>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Disbursement</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Mark sanctioned loans as disbursed to the borrower.
          </p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm text-gray-500 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium border border-yellow-200">
            {total} awaiting disbursement
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
          emptyMessage="No loans pending disbursement."
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

      {/* ── Confirm Disburse Modal ──────────────────────────────────── */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title="Confirm Disbursement"
        maxWidth="max-w-md"
      >
        {modal.loan && (
          <div className="space-y-5">
            {/* Warning message */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-800">
                This action is <strong>irreversible</strong>. Please confirm that funds have been
                transferred to the borrower before proceeding.
              </p>
            </div>

            {/* Loan details */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Borrower</span>
                <span className="font-medium text-gray-900">
                  {(modal.loan.profileId as { fullName?: string })?.fullName ??
                   (modal.loan.borrowerId as { email?: string })?.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Loan Amount</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatCurrency(modal.loan.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Repayable</span>
                <span className="font-mono font-bold text-blue-700">
                  {formatCurrency(modal.loan.totalRepayment)}
                </span>
              </div>
            </div>

            {/* Error */}
            {modal.error && (
              <p className="text-sm text-red-600 font-medium">{modal.error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={closeModal} disabled={modal.isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDisburse}
                isLoading={modal.isSubmitting}
                disabled={modal.isSubmitting}
              >
                Yes, Mark Disbursed
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}