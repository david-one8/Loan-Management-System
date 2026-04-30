'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { get, patch } from '@/lib/api';
import type { Loan, PaginatedResponse, TableColumn } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/ToastProvider';

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
      render: (row) => <span className="text-sm font-medium text-gray-900">{row.borrowerId?.email ?? '-'}</span>,
    },
    {
      key: 'fullName',
      label: 'Full Name',
      render: (row) => <span className="text-sm text-gray-700">{row.profileId?.fullName ?? '-'}</span>,
    },
    {
      key: 'amount',
      label: 'Loan Amount',
      render: (row) => <span className="text-sm font-mono font-semibold">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'totalRepayment',
      label: 'Total Repayment',
      render: (row) => <span className="text-sm font-mono text-blue-700 font-semibold">{formatCurrency(row.totalRepayment)}</span>,
    },
    {
      key: 'sanctionedAt',
      label: 'Sanctioned On',
      render: (row) => <span className="text-sm text-gray-500">{row.sanctionedAt ? formatDate(row.sanctionedAt) : '-'}</span>,
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
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Disbursement</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Mark sanctioned loans as disbursed to the borrower.
          </p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium border border-yellow-200">
            {total} awaiting disbursement
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
          emptyMessage="No loans pending disbursement."
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

      <Modal isOpen={modal.isOpen} onClose={closeModal} title="Confirm Disbursement" maxWidth="max-w-md">
        {modal.loan && (
          <div className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                Confirm that funds have been transferred before marking this loan as disbursed.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Borrower</span>
                <span className="font-medium text-gray-900">{modal.loan.profileId?.fullName ?? modal.loan.borrowerId?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Loan Amount</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(modal.loan.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Repayable</span>
                <span className="font-mono font-bold text-blue-700">{formatCurrency(modal.loan.totalRepayment)}</span>
              </div>
            </div>
            {modal.error && <p className="text-sm text-red-600 font-medium">{modal.error}</p>}
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
