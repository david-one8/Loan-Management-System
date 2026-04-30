'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { get, patch } from '@/lib/api';
import type { Loan, PaginatedResponse, SanctionActionPayload, TableColumn } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';

const PAGE_LIMIT = 10;

type LoanRow = Loan;
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
  mode: null,
  loan: null,
  remark: '',
  reason: '',
  isSubmitting: false,
  error: '',
};

export default function SanctionPage() {
  const { showSuccess, showError } = useToast();

  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modal, setModal] = useState<ModalState>(MODAL_INIT);

  const fetchLoans = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    setFetchError('');

    try {
      const response = await get<PaginatedResponse<LoanRow>>(
        `/sanction/loans?page=${nextPage}&limit=${PAGE_LIMIT}`
      );
      const data = response.data;

      setLoans(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setPage(data?.page ?? nextPage);
      setTotalPages(Math.max(1, data?.totalPages ?? 1));
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Could not load loans.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans(page);
  }, [fetchLoans, page]);

  function openModal(mode: Exclude<ModalMode, null>, loan: LoanRow) {
    setModal({ mode, loan, remark: '', reason: '', isSubmitting: false, error: '' });
  }

  function closeModal() {
    if (modal.isSubmitting) return;
    setModal(MODAL_INIT);
  }

  async function handleAction() {
    if (!modal.loan || !modal.mode) return;

    if (modal.mode === 'reject' && !modal.reason.trim()) {
      setModal((prev) => ({ ...prev, error: 'Rejection reason is required.' }));
      return;
    }

    setModal((prev) => ({ ...prev, isSubmitting: true, error: '' }));

    try {
      const payload: SanctionActionPayload = {
        action: modal.mode,
        reason: modal.mode === 'reject' ? modal.reason.trim() : modal.remark.trim() || undefined,
      };

      await patch<{ loan: Loan }>(`/sanction/loans/${modal.loan._id}`, payload);
      showSuccess(modal.mode === 'approve' ? 'Loan approved successfully.' : 'Loan rejected.');
      setModal(MODAL_INIT);
      fetchLoans(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed.';
      setModal((prev) => ({ ...prev, isSubmitting: false, error: message }));
      showError(message);
    }
  }

  const columns: TableColumn<LoanRow>[] = [
    {
      key: 'borrowerEmail',
      label: 'Borrower Email',
      render: (row) => <span className="text-sm font-medium text-gray-900">{row.borrowerId?.email ?? '-'}</span>,
    },
    {
      key: 'fullName',
      label: 'Full Name',
      render: (row) => <span className="text-sm text-gray-700">{row.profileId?.fullName ?? '-'}</span>,
    },
    {
      key: 'pan',
      label: 'PAN',
      render: (row) => <span className="text-sm font-mono text-gray-700">{row.profileId?.pan ?? '-'}</span>,
    },
    {
      key: 'amount',
      label: 'Loan Amount',
      render: (row) => <span className="text-sm font-mono font-semibold">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'createdAt',
      label: 'Applied On',
      render: (row) => <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => openModal('approve', row)}>
            Approve
          </Button>
          <Button variant="danger" size="sm" onClick={() => openModal('reject', row)}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sanction</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve or reject loan applications.</p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm text-gray-500 bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium border border-blue-200">
            {total} pending
          </span>
        )}
      </div>

      {fetchError && (
        <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="text-sm text-red-700 font-medium">{fetchError}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchLoans(page)}>
            Retry
          </Button>
        </div>
      )}

      <Card noPadding>
        <Table<LoanRow>
          columns={columns}
          data={loans}
          isLoading={isLoading}
          emptyMessage="No loan applications pending sanction."
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

      <Modal
        isOpen={modal.mode === 'approve'}
        onClose={closeModal}
        title="Approve Loan"
        maxWidth="max-w-md"
      >
        {modal.loan && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
              <div><span className="text-gray-500">Borrower: </span><span className="font-medium">{modal.loan.profileId?.fullName ?? modal.loan.borrowerId?.email}</span></div>
              <div><span className="text-gray-500">Amount: </span><span className="font-mono font-semibold">{formatCurrency(modal.loan.amount)}</span></div>
              <div><span className="text-gray-500">Total Repayable: </span><span className="font-mono font-semibold">{formatCurrency(modal.loan.totalRepayment)}</span></div>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Sanction remark</span>
              <textarea
                value={modal.remark}
                onChange={(e) => setModal((prev) => ({ ...prev, remark: e.target.value }))}
                className="w-full min-h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional remark"
                disabled={modal.isSubmitting}
              />
            </label>
            {modal.error && <p className="text-sm text-red-600 font-medium">{modal.error}</p>}
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeModal} disabled={modal.isSubmitting}>Cancel</Button>
              <Button variant="primary" onClick={handleAction} isLoading={modal.isSubmitting} disabled={modal.isSubmitting}>Approve</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modal.mode === 'reject'}
        onClose={closeModal}
        title="Reject Loan"
        maxWidth="max-w-md"
      >
        {modal.loan && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
              <div><span className="text-gray-500">Borrower: </span><span className="font-medium">{modal.loan.profileId?.fullName ?? modal.loan.borrowerId?.email}</span></div>
              <div><span className="text-gray-500">Amount: </span><span className="font-mono font-semibold">{formatCurrency(modal.loan.amount)}</span></div>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Rejection reason</span>
              <textarea
                value={modal.reason}
                onChange={(e) => setModal((prev) => ({ ...prev, reason: e.target.value, error: '' }))}
                className="w-full min-h-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Provide a clear reason for rejection."
                disabled={modal.isSubmitting}
              />
            </label>
            {modal.error && <p className="text-sm text-red-600 font-medium">{modal.error}</p>}
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeModal} disabled={modal.isSubmitting}>Cancel</Button>
              <Button variant="danger" onClick={handleAction} isLoading={modal.isSubmitting} disabled={modal.isSubmitting}>Reject</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
