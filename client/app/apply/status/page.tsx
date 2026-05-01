'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  ClipboardCheck,
  Clock,
  Trophy,
  XCircle,
} from 'lucide-react';
import { get } from '@/lib/api';
import type { BorrowerLoanResponse, Loan, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import PaymentHistoryTable from '@/components/loan/PaymentHistoryTable';
import ProgressBar from '@/components/ui/ProgressBar';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Repayment Progress</span>
        <span className="font-bold tabular-nums text-brand-700 dark:text-brand-400">{pct.toFixed(1)}%</span>
      </div>
      <ProgressBar value={Number(pct.toFixed(1))} variant={pct >= 100 ? 'success' : 'gradient'} size="lg" />
      <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-[#1e293b] dark:bg-[#0A0F1E]">
          <p className="text-2xs uppercase text-slate-400">Paid</p>
          <p className="font-mono text-sm font-bold tabular-nums text-success-700 dark:text-success-400">{formatCurrency(loan.totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-[#1e293b] dark:bg-[#0A0F1E]">
          <p className="text-2xs uppercase text-slate-400">Outstanding</p>
          <p className="font-mono text-sm font-bold tabular-nums text-danger-600 dark:text-danger-400">{formatCurrency(loan.outstandingBalance)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-[#1e293b] dark:bg-[#0A0F1E]">
          <p className="text-2xs uppercase text-slate-400">Total</p>
          <p className="font-mono text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">{formatCurrency(loan.totalRepayment)}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 dark:border-[#1e293b]">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

function StatusIcon({ status }: { status: Loan['status'] }) {
  const map = {
    applied: { icon: Clock, color: 'text-brand-600', bg: 'bg-brand-100 dark:bg-brand-950' },
    sanctioned: { icon: ClipboardCheck, color: 'text-warning-600', bg: 'bg-warning-100 dark:bg-warning-500/15' },
    disbursed: { icon: Banknote, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-500/15' },
    closed: { icon: Trophy, color: 'text-success-600', bg: 'bg-success-100 dark:bg-success-500/15' },
    rejected: { icon: XCircle, color: 'text-danger-600', bg: 'bg-danger-100 dark:bg-danger-500/15' },
  };
  const item = map[status];
  const Icon = item.icon;
  const isActive = status !== 'closed' && status !== 'rejected';

  return (
    <div className={`relative mx-auto mb-5 h-20 w-20 ${item.color}`}>
      {isActive && <div className="absolute inset-0 rounded-full border-2 border-current opacity-30 animate-pulse-ring" />}
      <div className={`flex h-20 w-20 items-center justify-center rounded-full ${item.bg}`}>
        <Icon className="h-9 w-9" />
      </div>
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Could not load loan details</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
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
    <div className="space-y-5 animate-fade-up">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
        <StatusIcon status={loan.status} />
        <Badge status={loan.status} />
        <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-50">{status.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{status.message}</p>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-600">Applied on {formatDate(loan.createdAt)}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Loan Details
        </p>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
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
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-[#1e293b]">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
              Sanction Remark
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{loan.sanctionRemark}</p>
          </div>
        )}
      </div>

      {loan.status === 'rejected' && loan.rejectionReason && (
        <div className="flex items-start gap-4 rounded-2xl border border-danger-200 bg-danger-50 p-6 dark:border-danger-900 dark:bg-danger-950/20">
          <AlertTriangle className="h-6 w-6 flex-shrink-0 text-danger-600 dark:text-danger-400" />
          <div>
            <p className="text-sm font-semibold text-danger-800 dark:text-danger-300">Reason for Rejection</p>
            <p className="mt-1 text-sm text-danger-700 dark:text-danger-400">{loan.rejectionReason}</p>
          </div>
        </div>
      )}

      {showPayments && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
          <RepaymentProgress loan={loan} />
        </div>
      )}

      {showPayments && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
          <PaymentHistoryTable payments={payments} />
        </div>
      )}
    </div>
  );
}
