type ProgressBarSize = 'sm' | 'md' | 'lg';
type ProgressBarVariant = 'default' | 'success' | 'gradient';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  size?: ProgressBarSize;
  variant?: ProgressBarVariant;
}

const sizeMap: Record<ProgressBarSize, string> = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const variantMap: Record<ProgressBarVariant, string> = {
  default: 'from-brand-500 to-brand-600',
  success: 'from-success-500 to-success-600',
  gradient: 'from-brand-500 via-violet-500 to-purple-600',
};

export default function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  variant = 'default',
}: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1.5 flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Progress</span>
          <span className="font-semibold tabular-nums">{safeValue}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-slate-100 dark:bg-slate-800 ${sizeMap[size]}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${variantMap[variant]}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
