import React from 'react';

type CardVariant = 'default' | 'elevated' | 'flat' | 'brand' | 'success' | 'danger';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  flat?: boolean;
  variant?: CardVariant;
  padding?: CardPadding;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
  divided?: boolean;
}

const variantMap: Record<CardVariant, string> = {
  default: 'border-slate-200 bg-white shadow-card dark:border-[#1e293b] dark:bg-[#111827]',
  elevated: 'border-slate-200 bg-white shadow-card-lg dark:border-[#1e293b] dark:bg-[#111827]',
  flat: 'border-slate-100 bg-white shadow-none dark:border-slate-800 dark:bg-[#111827]',
  brand: 'border-brand-200 bg-brand-50/50 shadow-card dark:border-brand-900 dark:bg-brand-950/20',
  success: 'border-success-200 bg-success-50/50 shadow-card dark:border-success-900 dark:bg-success-950/20',
  danger: 'border-danger-200 bg-danger-50/50 shadow-card dark:border-danger-900 dark:bg-danger-950/20',
};

const paddingMap: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-[#1e293b]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardSection({ children, className = '', divided = false }: CardSectionProps) {
  return (
    <div
      className={[
        divided ? 'mt-4 border-t border-slate-100 pt-4 dark:border-[#1e293b]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default function Card({
  children,
  className = '',
  noPadding = false,
  flat = false,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const resolvedVariant = flat ? 'flat' : variant;

  return (
    <div
      className={[
        'rounded-2xl border',
        variantMap[resolvedVariant],
        noPadding ? 'overflow-hidden' : paddingMap[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
