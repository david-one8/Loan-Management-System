import { Loader2 } from 'lucide-react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  label?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export default function Spinner({
  size = 'md',
  color = 'text-brand-600 dark:text-brand-400',
  label = 'Loading...',
}: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center justify-center">
      <Loader2 className={`${sizeMap[size]} ${color} animate-spin`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin-slow text-brand-600 dark:text-brand-400" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  );
}

export function OverlaySpinner() {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 backdrop-blur-sm dark:bg-slate-950/80"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin-slow text-brand-600 dark:text-brand-400" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
    </div>
  );
}
