import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  iconColor?: string;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  iconColor = 'bg-brand-50 text-brand-600 border-brand-100 dark:bg-brand-950/50 dark:text-brand-400 dark:border-brand-900',
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl dark:text-slate-50">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="md:pt-1">{action}</div>}
    </div>
  );
}
