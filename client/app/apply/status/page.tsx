'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { get } from '@/lib/api';
import type { Loan, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import PaymentHistoryTable from '@/components/loan/PaymentHistoryTable';
import { PageSpinner } from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

// ─── Status message map ───────────────────────────────────────────────────────

interface StatusConfig {
  title: string;
  message: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  textColor: string;
}

function getStatusConfig(status: Loan['status']): StatusConfig {
  const icons = {
    clock: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    banknote: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
      </svg>
    ),
    trophy: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    xCircle: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const map: Record<Loan['status'], StatusConfig> = {
    applied: {
      title:     'Application Submitted',
      message:   'Your application is under review. Our team will evaluate your profile shortly.',
      icon:      icons.clock,
      bg:        'bg-blue-50',
      border:    'border-blue-200',
      textColor: 'text-blue-800',
    },
    sanctioned: {
      title:     'Loan Sanctioned!',
      message:   'Congratulations! Your loan has been approved. It is awaiting disbursement to your account.',
      icon:      icons.check,
      bg:        'bg-yellow-50',
      border:    'border-yellow-200',
      textColor: 'text-yellow-800',
    },
    disbursed: {
      title:     'Loan Disbursed',
      message:   'Your loan amount has been credited. Please repay on time to maintain a good credit profile.',
      icon:      icons.banknote,
      bg:        'bg-purple-50',
      border:    'border-purple-200',
      textColor: 'text-purple-800',
    },
    closed: {
      title:     'Loan Fully Repaid',
      message:   'Congratulations! You have successfully repaid your loan. Thank you for choosing LMS.',
      icon:      icons.trophy,
      bg:        'bg-green-50',
      border:    'border-green-200',
      textColor: 'text-green-800',
    },
    rejected: {
      title:     'Application Rejected',
      message:   'Unfortunately, your loan application was not approved.',
      icon:      icons.xCircle,
      bg:        'bg-red-50',
      border:    'border-red-200',
      textColor: 'text-red-800',
    },
  };

  return map[status];
}

// ─── Repayment progress bar ───────────────────────────────────────────────────

function RepaymentProgress({ loan }: { loan: Loan }) {
  const pct = loan.totalRepayment > 0
    ? Math.min((loan.totalPaid / loan.totalRepayment) * 100, 100)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 font-medium">Repayment Progress</span>
        <span className="text-blue-700 font-bold tabular-nums">{pct.toFixed(1)}%</span>
      </div>

      {/* Track */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-500',
            pct >= 100 ? 'bg-green-500' : 'bg-blue-600',
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Labels */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">Paid</p>
          <p className="text-sm font-bold text-green-700 font-mono tabular-nums">
            {formatCurrency(loan.totalPaid)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-sm font-bold text-red-600 font-mono tabular-nums">
            {formatCurrency(loan.outstandingBalance)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-bold text-gray-800 font-mono tabular-nums">
            {formatCurrency(loan.totalRepayment)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Summary row ─────────────────────────────────────────────────────────────

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StatusPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loan, setLoan]       = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [error, setError]               = useState('');

  // ── Fetch loan ────────────────────────────────────────────────────

  const fetchLoan = useCallback(async () => {
    setError('');
    try {
      const res = await get<Loan>('/borrower/loan');
      if (!res.data) throw new Error('Loan not found.');
      setLoan(res.data);

      // Fetch payment history if disbursed or closed
      if (res.data.status === 'disbursed' || res.data.status === 'closed') {
        fetchPayments(res.data._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load loan details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async (loanId: string) => {
    setIsLoadingPayments(true);
    try {
      const res = await get<Payment[]>(`/borrower/loan/${loanId}/payments`);
      if (res.data) setPayments(res.data);
    } catch {
      // Non-fatal — table shows empty state
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) fetchLoan();
  }, [authLoading, isAuthenticated, fetchLoan]);

  // ── Render ────────────────────────────────────────────────────────

  if (isLoading) return <PageSpinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
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

  const config = getStatusConfig(loan.status);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Status</h1>
          <p className="text-sm text-gray-500 mt-1">
            Applied on {formatDate(loan.createdAt)}
          </p>
        </div>
        <Badge status={loan.status} />
      </div>

      {/* Status banner */}
      <div className={`flex items-start gap-4 ${config.bg} border ${config.border} rounded-2xl p-5`}>
        <div className={`shrink-0 ${config.textColor}`}>{config.icon}</div>
        <div>
          <p className={`text-base font-bold ${config.textColor}`}>{config.title}</p>
          <p className={`text-sm mt-1 leading-relaxed ${config.textColor} opacity-90`}>
            {config.message}
          </p>
          {/* Rejection reason */}
          {loan.status === 'rejected' && loan.rejectionReason && (
            <div className="mt-3 bg-red-100 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                Reason
              </p>
              <p className="text-sm text-red-800">{loan.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Loan summary card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Loan Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div>
            <SummaryRow label="Loan Amount"     value={formatCurrency(loan.amount)}          mono />
            <SummaryRow label="Tenure"          value={`${loan.tenure} days`}                      />
            <SummaryRow label="Interest Rate"   value={`${loan.interestRate ?? 12}% p.a.`}         />
          </div>
          <div>
            <SummaryRow label="Simple Interest" value={formatCurrency(Math.round(loan.simpleInterest))} mono />
            <SummaryRow label="Total Repayment" value={formatCurrency(loan.totalRepayment)}             mono />
            <SummaryRow label="Applied On"      value={formatDate(loan.createdAt)}                       />
          </div>
        </div>

        {/* Sanction remark */}
        {loan.sanctionRemark && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Sanction Remark
            </p>
            <p className="text-sm text-gray-700">{loan.sanctionRemark}</p>
          </div>
        )}

        {/* Sanctioned / Disbursed dates */}
        {(loan.sanctionedAt || loan.disbursedAt || loan.closedAt) && (
          <div className="mt-4 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {loan.sanctionedAt && (
              <div>
                <p className="text-xs text-gray-400">Sanctioned On</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{formatDate(loan.sanctionedAt)}</p>
              </div>
            )}
            {loan.disbursedAt && (
              <div>
                <p className="text-xs text-gray-400">Disbursed On</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{formatDate(loan.disbursedAt)}</p>
              </div>
            )}
            {loan.closedAt && (
              <div>
                <p className="text-xs text-gray-400">Closed On</p>
                <p className="text-sm font-medium text-green-700 mt-0.5">{formatDate(loan.closedAt)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repayment progress — only for disbursed / closed */}
      {(loan.status === 'disbursed' || loan.status === 'closed') && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <RepaymentProgress loan={loan} />
        </div>
      )}

      {/* Payment history — only for disbursed / closed */}
      {(loan.status === 'disbursed' || loan.status === 'closed') && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6">
          <PaymentHistoryTable
            payments={payments}
            isLoading={isLoadingPayments}
          />
        </div>
      )}

      {/* Closed celebration */}
      {loan.status === 'closed' && (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">🎉</p>
          <p className="text-lg font-bold text-green-700">
            Loan Closed — Well Done!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Your loan has been fully repaid. Thank you for being a valued customer.
          </p>
        </div>
      )}
    </div>
  );
}