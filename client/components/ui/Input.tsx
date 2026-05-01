import { AlertCircle } from 'lucide-react';
import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  name: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const textPrefixClasses = [
  'absolute left-0 top-0 bottom-0 flex items-center px-3.5',
  'rounded-l-lg border-r border-slate-300 bg-slate-50',
  'text-sm font-medium text-slate-500',
  'dark:border-[#1e293b] dark:bg-slate-800 dark:text-slate-400',
].join(' ');

const iconPrefixClasses = [
  'absolute left-3 top-1/2 -translate-y-1/2',
  'pointer-events-none h-4 w-4 text-slate-400 dark:text-slate-600',
].join(' ');

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      name,
      error,
      hint,
      prefix,
      suffix,
      className = '',
      required,
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = `input-${name}`;
    const errorId = `error-${name}`;
    const hintId = `hint-${name}`;
    const hasError = Boolean(error);
    const isTextPrefix = typeof prefix === 'string' || typeof prefix === 'number';

    const baseInputClasses = [
      'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm',
      'text-slate-900 transition-all duration-150',
      'placeholder:text-slate-400',
      'hover:border-slate-400 focus:outline-none focus:ring-2',
      'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300',
      'dark:bg-[#0d1526] dark:text-slate-100 dark:placeholder:text-slate-600',
      'dark:hover:border-slate-600 dark:disabled:bg-slate-900 dark:disabled:text-slate-700',
      prefix ? (isTextPrefix ? 'pl-14' : 'pl-10') : '',
      suffix ? 'pr-12' : '',
      hasError
        ? 'animate-shake border-danger-400 bg-danger-50/30 focus:border-danger-400 focus:ring-danger-500/20 dark:border-danger-500 dark:bg-danger-500/5'
        : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-[#1e293b] dark:focus:border-brand-400 dark:focus:ring-brand-400/20',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 select-none dark:text-slate-300"
          >
            {label}
            {required && (
              <span className="ml-0.5 text-danger-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {prefix && (
            <span className={isTextPrefix ? textPrefixClasses : iconPrefixClasses}>
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              [error ? errorId : '', hint ? hintId : '']
                .filter(Boolean)
                .join(' ') || undefined
            }
            className={baseInputClasses}
            {...rest}
          />

          {suffix && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
              {suffix}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-slate-400 dark:text-slate-600">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-xs text-danger-600 dark:text-danger-400"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
