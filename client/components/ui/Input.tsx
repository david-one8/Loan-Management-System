import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

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

    const baseInputClasses = [
      'w-full text-sm text-gray-900 bg-white',
      'transition-colors duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'placeholder:text-gray-400',
      'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
      prefix ? 'rounded-r-lg' : 'rounded-lg',
      suffix ? 'rounded-l-lg' : 'rounded-lg',
      prefix && suffix ? 'rounded-none' : '',
      hasError
        ? 'border border-red-400 focus:ring-red-400 focus:border-red-400'
        : 'border border-gray-300 focus:ring-blue-500 focus:border-blue-500',
      prefix || suffix ? 'px-3 py-2' : 'px-3 py-2',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 select-none"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper for prefix/suffix */}
        <div className="flex items-stretch">
          {prefix && (
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm select-none shrink-0">
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
            <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm select-none shrink-0">
              {suffix}
            </span>
          )}
        </div>

        {/* Hint text */}
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 flex items-center gap-1">
            <svg
              className="w-3 h-3 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;