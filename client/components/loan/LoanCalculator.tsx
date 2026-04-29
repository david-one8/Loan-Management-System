'use client';

import React from 'react';
import {
  formatCurrency,
  calculateSI,
  calculateTotalRepayment,
} from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoanCalculatorProps {
  amount: number;
  tenure: number;
  interestRate?: number;
}

interface CalcRow {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoanCalculator({
  amount,
  tenure,
  interestRate = 12,
}: LoanCalculatorProps) {
  const si = calculateSI(amount, tenure);
  const totalRepayment = calculateTotalRepayment(amount, tenure);
  const progressPct = Math.min((si / totalRepayment) * 100, 100);

  const rows: CalcRow[] = [
    { label: 'Loan Amount',      value: formatCurrency(amount),        mono: true },
    { label: 'Tenure',           value: `${tenure} day${tenure !== 1 ? 's' : ''}` },
    { label: 'Interest Rate',    value: `${interestRate}% p.a.` },
    { label: 'Simple Interest',  value: formatCurrency(Math.round(si)), mono: true },
    {
      label: 'Total Repayment',
      value: formatCurrency(Math.round(totalRepayment)),
      highlight: true,
      mono: true,
    },
  ];

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-white border-b border-gray-200">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Loan Summary
        </p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {rows.map((row) => (
          <div
            key={row.label}
            className={[
              'flex items-center justify-between px-5 py-3',
              row.highlight ? 'bg-blue-50' : '',
            ].join(' ')}
          >
            <span
              className={[
                'text-sm',
                row.highlight ? 'font-semibold text-blue-700' : 'text-gray-600',
              ].join(' ')}
            >
              {row.label}
            </span>
            <span
              className={[
                'text-sm',
                row.mono ? 'font-mono' : '',
                row.highlight
                  ? 'font-bold text-blue-700 text-base'
                  : 'font-medium text-gray-900',
              ].join(' ')}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Interest breakdown bar */}
      <div className="px-5 py-4 border-t border-gray-200 bg-white">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Principal</span>
          <span>Interest ({progressPct.toFixed(1)}%)</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* Principal portion */}
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${100 - progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1.5">
          <span className="text-blue-600 font-mono font-medium">
            {formatCurrency(amount)}
          </span>
          <span className="text-orange-500 font-mono font-medium">
            +{formatCurrency(Math.round(si))}
          </span>
        </div>
      </div>
    </div>
  );
}