import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: ReactNode;
  trend?: ReactNode;
  color?: string;
}

export default function StatCard({
  label,
  value,
  subValue,
  icon,
  trend,
  color = 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-md dark:border-[#1e293b] dark:bg-[#111827]">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          {icon}
        </div>
        {trend}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {subValue && (
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-600">{subValue}</p>
      )}
    </div>
  );
}
