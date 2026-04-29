import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeStatus =
  | 'applied'
  | 'sanctioned'
  | 'disbursed'
  | 'closed'
  | 'rejected'
  | 'passed'
  | 'failed'
  | 'pending'
  | 'No Profile'
  | 'Profile Complete'
  | 'BRE Failed'
  | string;

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

// ─── Color Map ────────────────────────────────────────────────────────────────

const colorMap: Record<string, string> = {
  // Loan statuses
  applied:    'bg-blue-100 text-blue-800 border border-blue-200',
  sanctioned: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  disbursed:  'bg-purple-100 text-purple-800 border border-purple-200',
  closed:     'bg-green-100 text-green-800 border border-green-200',
  rejected:   'bg-red-100 text-red-800 border border-red-200',

  // BRE statuses
  passed:  'bg-green-100 text-green-800 border border-green-200',
  failed:  'bg-red-100 text-red-800 border border-red-200',
  pending: 'bg-gray-100 text-gray-700 border border-gray-200',

  // Lead / profile statuses
  'Profile Complete': 'bg-green-100 text-green-800 border border-green-200',
  'No Profile':       'bg-gray-100 text-gray-600 border border-gray-200',
  'BRE Failed':       'bg-red-100 text-red-800 border border-red-200',
};

const fallback = 'bg-gray-100 text-gray-700 border border-gray-200';

// ─── Label Formatter ──────────────────────────────────────────────────────────

function formatLabel(status: string): string {
  // Already correctly cased multi-word statuses
  if (['No Profile', 'Profile Complete', 'BRE Failed'].includes(status)) {
    return status;
  }
  // Capitalise first letter
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Badge({ status, className = '' }: BadgeProps) {
  const colorClasses = colorMap[status] ?? fallback;

  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5',
        'text-xs font-medium rounded-full',
        'whitespace-nowrap',
        colorClasses,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {formatLabel(status)}
    </span>
  );
}