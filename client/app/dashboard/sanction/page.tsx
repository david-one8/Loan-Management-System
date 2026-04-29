'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, patch } from '@/lib/api';
import type { Loan, TableColumn, PaginatedResponse, SanctionActionPayload } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanRow = Loan & Record<string, unknown>;

type ModalMode = 'approve' | 'reject' | null;

interface ModalState {
  mode: ModalMode;
  loan: LoanRow | null;
  remark: string;
  reason: string;
  isSubmitting: boolean;
  error: string;
}

const MODAL_INIT: ModalState = {
  mode: null, loan: null, remark: '', reason: '', isSubmitting: false, error: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;

export default function SanctionPage() {
  const { showSuccess, showError } = useToast();

  const [loans, setLoans]         = useState<LoanRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modal, setModal]         = useState<ModalState>(MODAL_INIT);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // ── Fetch ────────────────────────────────────────────────────────

  const fetchLoans = useCallback(async (p: number) => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await get<PaginatedResponse<LoanRow>>(
        `/sanction/loans?page=${p}&limit=${PAGE_LIMIT}`
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

  function openModal(mode: 'approve' | 'reject', loan: LoanRow) {
    setModal({ ...MODAL_INIT, mode, loan });
  }

  function closeModal() {
    if (modal.isSubmitting) return;
    setModal(MODAL_INIT);
  }

  async function handleSanctionAction() {
    if (!modal.loan || !modal.mode) return;

    // Validate reason for reject
    if (modal.mode === 'reject' && !modal.reason.trim()) {
      setModal((prev) => ({ ...prev, error: 'Rejection reason is required.' }));
      return;
    }

    setModal((prev) => ({ ...prev, isSubmitting: true, error: '' }));
    try {
      const payload: SanctionActionPayload = {
        action: modal.mode === 'approve' ? 'APPROVE' : 'REJECT',
        reason: modal.mode === 'reject' ? modal.reason.trim() : modal.remark.trim() || undefined,
      };

      await patch(`/sanction/loans/${modal.loan._id}`, payload);

      showSuccess(
        modal.mode === 'approve'
          ? 'Loan approved successfully.'
          : 'Loan rejected.'
      );
      closeModal();
      fetchLoans(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action failed. Please try again.';
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
      key: 'pan',
      label: 'PAN',
      render: (row) => (
        <span className="font-mono text-xs text-gray-800 tracking-wider">
          {(row.profileId as { pan?: string })?.pan ?? '—'}
        </span>
      ),
    },
    {
      key: 'monthlySalary',
      label: 'Monthly Salary',
      render: (row) => (
        <span className="text-sm font-mono tabular-nums text-gray-800">
          {(row.profileId as { monthlySalary?: number })?.monthlySalary != null
            ? formatCurrency((row.profileId as { monthlySalary: number }).monthlySalary)
            : '—'}
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
      key: 'tenure',
      label: 'Tenure',
      render: (row) => <span className="text-sm text-gray-700">{row.tenure} days</span>,
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
      key: 'createdAt',
      label: 'Applied On',
      render: (row) => (
        <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'salarySlip',
      label: 'Salary Slip',
      render: (row) => {
        const url = (row.profileId as { salarySlipUrl?: string })?.salarySlipUrl;
        return url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View
          </a>
        ) : <span className="text-gray-400 text-xs">Not uploaded</span>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => openModal('approve', row)}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => openModal('reject', row)}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Loan Sanction</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and approve or reject loan applications.
          </p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {total} application{total !== 1 ? 's' : ''} pending
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
          emptyMessage="No loans pending sanction."
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

      {/* ── Approve Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={modal.mode === 'approve'}
        onClose={closeModal}
        title="Approve Loan Application"
        maxWidth="max-w-lg"
      >
        {modal.loan && (
          <div className="space-y-5">
            {/* Loan summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge status="applied" />
                <span className="text-sm font-semibold text-green-800">
                  {(modal.loan.borrowerId as { email?: string })?.email}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div><span className="text-gray-500">Borrower: </span><span className="font-medium">{(modal.loan.profileId as { fullName?: string })?.fullName ?? '—'}</span></div>
                <div><span className="text-gray-500">Amount: </span><span className="font-mono font-semibold text-gray-900">{formatCurrency(modal.loan.amount)}</span></div>
                <div><span className="text-gray-500">Tenure: </span><span className="font-medium">{modal.loan.tenure} days</span></div>
                <div><span className="text-gray-500">Total Repayable: </span><span className="font-mono font-semibold text-blue-700">{formatCurrency(modal.loan.totalRepayment)}</span></div>
              </div>
            </div>

            {/* Optional remark */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="sanction-remark">
                Sanction Remark <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="sanction-remark"
                rows={3}
                value={modal.remark}
                onChange={(e) => setModal((prev) => ({ ...prev, remark: e.target.value }))}
                placeholder="Add a note for the borrower…"
                disabled={modal.isSubmitting}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
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
                onClick={handleSanctionAction}
                isLoading={modal.isSubmitting}
                disabled={modal.isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reject Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={modal.mode === 'reject'}
        onClose={closeModal}
        title="Reject Loan Application"
        maxWidth="max-w-lg"
      >
        {modal.loan && (
          <div className="space-y-5">
            {/* Summary strip */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1.5">
              <p className="text-sm font-semibold text-red-800">
                {(modal.loan.borrowerId as { email?: string })?.email}
              </p>
              <div className="grid grid-cols-2 gap-x-4 text-sm">
                <div><span className="text-gray-500">Amount: </span><span className="font-mono font-semibold">{formatCurrency(modal.loan.amount)}</span></div>
                <div><span className="text-gray-500">Tenure: </span><span className="font-medium">{modal.loan.tenure} days</span></div>
              </div>
            </div>

            {/* Required reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="reject-reason">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                value={modal.reason}
                onChange={(e) => setModal((prev) => ({ ...prev, reason: e.target.value, error: '' }))}
                placeholder="Provide a clear reason for rejection. This will be visible to the borrower."
                disabled={modal.isSubmitting}
                className={[
                  'w-full text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 disabled:opacity-50',
                  modal.error
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-red-500 focus:border-red-500',
                ].join(' ')}
              />
              {modal.error && (
                <p className="text-xs text-red-600">{modal.error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={closeModal} disabled={modal.isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleSanctionAction}
                isLoading={modal.isSubmitting}
                disabled={modal.isSubmitting}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}