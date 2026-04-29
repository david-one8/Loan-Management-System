import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Removes default padding — useful for full-bleed tables inside cards */
  noPadding?: boolean;
  /** Removes shadow, keeps border */
  flat?: boolean;
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
  /** Add a top divider line */
  divided?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
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
        divided ? 'border-t border-gray-200 pt-4 mt-4' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────

export default function Card({
  children,
  className = '',
  noPadding = false,
  flat = false,
}: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-xl border border-gray-200',
        flat ? '' : 'shadow-card',
        noPadding ? 'overflow-hidden' : 'p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}