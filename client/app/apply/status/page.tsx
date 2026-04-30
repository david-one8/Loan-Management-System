'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { get } from '@/lib/api';
import type { BorrowerLoanResponse, Loan, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import PaymentHistoryTable from '@/components/loan/PaymentHistoryTable';

function getStatusText(status: Loan['status']): { title: string; message: string; color: string } {
  switch (status) {
    case 'applied':
      return {
        title: 'Application submitted',
        message: 'Your loan is waiting for sanction review.',
        color: 'bg-blue-50 border-blue-200 text-blue-800',
      };
    case 'sanctioned':
      return {
        title: 'Loan sanctioned',
        message: 'Your loan has been approved and is waiting for disbursement.',
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      };
    case 'disbursed':
      return {
        title: 'Loan disbursed',
        message: 'Your loan is active. Repayments recorded by collection will appear below.',
        color: 'bg-purple-50 border-purple-200 text-purple-800',
      };
    case 'closed':
      return {
        title: 'Loan closed',
        message: 'Your loan has been fully repaid.',
        color: 'bg-green-50 border-green-200 text-green-800',
      };
    case 'rejected':
      return {
        title: 'Loan rejected',
        message: 'Your application was rejected by sanction.',
        color: 'bg-red-50 border-red-200 text-red-800',
      };
  }
}

function RepaymentProgress({ loan }: { loan: Loan }) {
  const pct = loan.totalRepayment > 0 ? Math.min((loan.totalPaid / loan.totalRepayment) * 100, 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 font-medium">Repayment Progress</span>
        <span className="text-blue-700 font-bold tabular-nums">{pct.toFixed(1)}%</span>
      </div>
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">Paid</p>
          <p className="text-sm font-bold text-green-700 font-mono">{formatCurrency(loan.totalPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-sm font-bold text-red-600 font-mono">{formatCurrency(loan.outstandingBalance)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-bold text-gray-800 font-mono">{formatCurrency(loan.totalRepayment)}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function StatusPage() {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLoan = useCallback(async () => {
    try {
      const response = await get<BorrowerLoanResponse>('/borrower/loan');
      const nextLoan = response.data?.loan;

      if (!nextLoan) {
        throw new Error('Loan not found.');
      }

      setLoan(nextLoan);
      setPayments(response.data?.payments ?? []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load loan details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLoan();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchLoan]);

  if (isLoading) return <PageSpinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div>
          <p className="text-base font-semibold text-gray-800">Could not load loan details</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
        <Button variant="secondary" onClick={fetchLoan}>
          Retry
        </Button>
      </div>
    );
  }

  if (!loan) return null;

  const status = getStatusText(loan.status);
  const showPayments = loan.status === 'disbursed' || loan.status === 'closed';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Status</h1>
          <p className="text-sm text-gray-500 mt-1">Applied on {formatDate(loan.createdAt)}</p>
        </div>
        <Badge status={loan.status} />
      </div>

      <div className={`${status.color} border rounded-2xl p-5`}>
        <p className="text-base font-bold">{status.title}</p>
        <p className="text-sm mt-1 leading-relaxed">{status.message}</p>
        {loan.status === 'rejected' && loan.rejectionReason && (
          <div className="mt-3 bg-red-100 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Reason</p>
            <p className="text-sm text-red-800">{loan.rejectionReason}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Loan Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div>
            <SummaryRow label="Loan Amount" value={formatCurrency(loan.amount)} />
            <SummaryRow label="Tenure" value={`${loan.tenure} days`} />
            <SummaryRow label="Interest Rate" value={`${loan.interestRate ?? 12}% p.a.`} />
          </div>
          <div>
            <SummaryRow label="Simple Interest" value={formatCurrency(Math.round(loan.simpleInterest))} />
            <SummaryRow label="Total Repayment" value={formatCurrency(loan.totalRepayment)} />
            <SummaryRow label="Applied On" value={formatDate(loan.createdAt)} />
          </div>
        </div>
        {loan.sanctionRemark && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Sanction Remark
            </p>
            <p className="text-sm text-gray-700">{loan.sanctionRemark}</p>
          </div>
        )}
      </div>

      {showPayments && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <RepaymentProgress loan={loan} />
        </div>
      )}

      {showPayments && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <PaymentHistoryTable payments={payments} />
        </div>
      )}
    </div>
  );
}
