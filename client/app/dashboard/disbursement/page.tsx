'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Banknote, Search } from 'lucide-react';
import { get, patch } from '@/lib/api';
import type { Loan, PaginatedResponse, TableColumn } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';
import PageHeader from '@/components/ui/PageHeader';

const PAGE_LIMIT = 10;

type LoanRow = Loan;

interface ModalState {
  isOpen: boolean;
  loan: LoanRow | null;
  isSubmitting: boolean;
  error: string;
}

const MODAL_INIT: ModalState = {
  isOpen: false,
  loan: null,
  isSubmitting: false,
  error: '',
};

export default function DisbursementPage() {
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
        `/disbursement/loans?page=${nextPage}&limit=${PAGE_LIMIT}`
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
      await patch<{ loan: Loan }>(`/disbursement/loans/${modal.loan._id}/disburse`, {});
      showSuccess('Loan marked as disbursed.');
      setModal(MODAL_INIT);
      fetchLoans(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Disbursement failed.';
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
      key: 'amount',
      label: 'Loan Amount',
      render: (row) => <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'totalRepayment',
      label: 'Total Repayment',
      render: (row) => <span className="font-mono text-sm font-semibold text-brand-700 dark:text-brand-400">{formatCurrency(row.totalRepayment)}</span>,
    },
    {
      key: 'sanctionedAt',
      label: 'Sanctioned On',
      render: (row) => <span className="text-sm text-slate-500 dark:text-slate-400">{row.sanctionedAt ? formatDate(row.sanctionedAt) : '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <Button variant="primary" size="sm" onClick={() => openModal(row)}>
          Mark Disbursed
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-full space-y-6 animate-fade-up">
      <PageHeader
        title="Disbursement"
        subtitle="Mark sanctioned loans as disbursed to the borrower."
        icon={<Banknote className="h-6 w-6" />}
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
            {total} awaiting disbursement
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
          emptyMessage="No loans pending disbursement."
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

      <Modal isOpen={modal.isOpen} onClose={closeModal} title="Confirm Disbursement" maxWidth="max-w-md">
        {modal.loan && (
          <div className="space-y-5">
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/20 dark:bg-warning-500/10">
              <p className="text-sm text-warning-800 dark:text-warning-400">
                Confirm that funds have been transferred before marking this loan as disbursed.
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-[#1e293b] dark:bg-[#0A0F1E]">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Borrower</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{modal.loan.profileId?.fullName ?? modal.loan.borrowerId?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Loan Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatCurrency(modal.loan.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Repayable</span>
                <span className="font-mono font-bold text-brand-700 dark:text-brand-400">{formatCurrency(modal.loan.totalRepayment)}</span>
              </div>
            </div>
            {modal.error && <p className="text-sm font-medium text-danger-600 dark:text-danger-400">{modal.error}</p>}
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeModal} disabled={modal.isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleDisburse} isLoading={modal.isSubmitting} disabled={modal.isSubmitting}>
                Yes, Mark Disbursed
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
