'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ClipboardCheck, Search } from 'lucide-react';
import { get, patch } from '@/lib/api';
import type { Loan, PaginatedResponse, SanctionActionPayload, TableColumn } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
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
    try {
      const response = await get<PaginatedResponse<LoanRow>>(
        `/sanction/loans?page=${nextPage}&limit=${PAGE_LIMIT}`
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
      render: (row) => <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{row.borrowerId?.email ?? '-'}</span>,
    },
    {
      key: 'fullName',
      label: 'Full Name',
      render: (row) => <span className="text-sm text-slate-700 dark:text-slate-300">{row.profileId?.fullName ?? '-'}</span>,
    },
    {
      key: 'pan',
      label: 'PAN',
      render: (row) => <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{row.profileId?.pan ?? '-'}</span>,
    },
    {
      key: 'amount',
      label: 'Loan Amount',
      render: (row) => <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'createdAt',
      label: 'Applied On',
      render: (row) => <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(row.createdAt)}</span>,
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
    <div className="max-w-full space-y-6 animate-fade-up">
      <PageHeader
        title="Sanction"
        subtitle="Review and approve or reject loan applications."
        icon={<ClipboardCheck className="h-6 w-6" />}
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
          <span className="rounded-full border border-warning-200 bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400">
            {total} pending
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
          emptyMessage="No loan applications pending sanction."
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

      <Modal
        isOpen={modal.mode === 'approve'}
        onClose={closeModal}
        title="Approve Loan"
        maxWidth="max-w-md"
      >
        {modal.loan && (
          <div className="space-y-5">
            <div className="rounded-xl border border-success-100 bg-success-50 p-4 text-sm dark:border-success-500/20 dark:bg-success-500/10">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-xs text-success-700 dark:text-success-400">Borrower<br /><span className="font-medium">{modal.loan.profileId?.fullName ?? modal.loan.borrowerId?.email}</span></div>
                <div className="text-xs text-success-700 dark:text-success-400">Amount<br /><span className="font-mono font-semibold">{formatCurrency(modal.loan.amount)}</span></div>
                <div className="text-xs text-success-700 dark:text-success-400">Tenure<br /><span className="font-mono font-semibold">{modal.loan.tenure} days</span></div>
              </div>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sanction remark</span>
              <textarea
                value={modal.remark}
                onChange={(e) => setModal((prev) => ({ ...prev, remark: e.target.value }))}
                className="min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#1e293b] dark:bg-[#0d1526] dark:text-slate-100"
                placeholder="Optional remark"
                disabled={modal.isSubmitting}
              />
            </label>
            {modal.error && <p className="text-sm font-medium text-danger-600 dark:text-danger-400">{modal.error}</p>}
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
            <div className="flex items-center gap-2 rounded-xl border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-400">
              <AlertTriangle className="h-5 w-5" />
              This action cannot be undone
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Rejection reason</span>
              <textarea
                value={modal.reason}
                onChange={(e) => setModal((prev) => ({ ...prev, reason: e.target.value, error: '' }))}
                className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-danger-500/20 dark:border-[#1e293b] dark:bg-[#0d1526] dark:text-slate-100"
                placeholder="Provide a clear reason for rejection."
                disabled={modal.isSubmitting}
              />
            </label>
            {modal.error && <p className="text-sm font-medium text-danger-600 dark:text-danger-400">{modal.error}</p>}
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
