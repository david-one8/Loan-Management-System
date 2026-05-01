'use client';

import { Calculator, Info } from 'lucide-react';
import {
  formatCurrency,
  calculateSI,
  calculateTotalRepayment,
} from '@/lib/utils';

interface LoanCalculatorProps {
  amount: number;
  tenure: number;
  interestRate?: number;
}

function Stat({
  label,
  value,
  className = 'text-slate-100',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="mb-1 text-2xs font-mono uppercase text-slate-500">{label}</p>
      <p className={`text-base font-bold font-mono tabular-nums ${className}`}>{value}</p>
    </div>
  );
}

export default function LoanCalculator({
  amount,
  tenure,
  interestRate = 12,
}: LoanCalculatorProps) {
  const si = calculateSI(amount, tenure);
  const totalRepayment = calculateTotalRepayment(amount, tenure);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-card dark:border-[#1e293b]">
      <div className="flex items-center justify-between bg-slate-900 px-5 py-3 dark:bg-black">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-danger-500" />
          <span className="h-3 w-3 rounded-full bg-warning-500" />
          <span className="h-3 w-3 rounded-full bg-success-500" />
          <span className="ml-2 text-xs font-mono text-slate-400">loan-summary.json</span>
        </div>
        <Calculator className="h-4 w-4 text-slate-600" />
      </div>

      <div className="grid grid-cols-1 gap-5 bg-[#0d1526] p-5 sm:grid-cols-2 dark:bg-black">
        <Stat label="principal" value={formatCurrency(amount)} className="text-brand-400" />
        <Stat label="tenure" value={`${tenure} days`} />
        <Stat label="interest_rate" value={`${interestRate}% p.a.`} />
        <Stat label="simple_interest" value={formatCurrency(Math.round(si))} className="text-warning-400" />
        <div className="border-t border-white/10 pt-4 sm:col-span-2">
          <Stat
            label="total_repayment"
            value={formatCurrency(Math.round(totalRepayment))}
            className="text-xl text-success-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-800 px-5 py-2.5 dark:bg-[#0d1526]">
        <Info className="h-3.5 w-3.5 text-brand-500" />
        <p className="text-xs font-mono text-slate-500">
          {`// Fixed rate: ${interestRate}% p.a. | Simple Interest`}
        </p>
      </div>
    </div>
  );
}
