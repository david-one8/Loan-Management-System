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

const statusMap: Record<string, { badge: string; dot: string }> = {
  applied: {
    badge: 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-900',
    dot: 'bg-brand-500 animate-pulse',
  },
  sanctioned: {
    badge: 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20',
    dot: 'bg-warning-500 animate-pulse',
  },
  disbursed: {
    badge: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
    dot: 'bg-violet-500 animate-pulse',
  },
  closed: {
    badge: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20',
    dot: 'bg-success-500',
  },
  rejected: {
    badge: 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/20',
    dot: 'bg-danger-500',
  },
  passed: {
    badge: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20',
    dot: 'bg-success-500',
  },
  failed: {
    badge: 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/20',
    dot: 'bg-danger-500',
  },
  pending: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  'Profile Complete': {
    badge: 'bg-success-50 text-success-700 border-success-100 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20',
    dot: 'bg-success-500',
  },
  'No Profile': {
    badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  'BRE Failed': {
    badge: 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/20',
    dot: 'bg-danger-500',
  },
};

const fallback = {
  badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  dot: 'bg-slate-400',
};

function formatLabel(status: string): string {
  if (['No Profile', 'Profile Complete', 'BRE Failed'].includes(status)) {
    return status;
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const color = statusMap[status] ?? fallback;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
        'text-xs font-semibold whitespace-nowrap',
        color.badge,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${color.dot}`} />
      {formatLabel(status)}
    </span>
  );
}
