import React from 'react';
import Spinner from './Spinner';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-blue-600 text-white',
    'hover:bg-blue-700 active:bg-blue-800',
    'border border-transparent',
    'shadow-sm',
    'disabled:bg-blue-300 disabled:cursor-not-allowed',
  ].join(' '),

  secondary: [
    'bg-white text-gray-700',
    'hover:bg-gray-50 active:bg-gray-100',
    'border border-gray-300',
    'shadow-sm',
    'disabled:text-gray-400 disabled:cursor-not-allowed',
  ].join(' '),

  danger: [
    'bg-red-600 text-white',
    'hover:bg-red-700 active:bg-red-800',
    'border border-transparent',
    'shadow-sm',
    'disabled:bg-red-300 disabled:cursor-not-allowed',
  ].join(' '),

  ghost: [
    'bg-transparent text-gray-600',
    'hover:bg-gray-100 active:bg-gray-200',
    'border border-transparent',
    'disabled:text-gray-400 disabled:cursor-not-allowed',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-lg gap-2',
};

const spinnerSizeMap: Record<ButtonSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

// ─── Component ────────────────────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const classes = [
      'inline-flex items-center justify-center',
      'transition-colors duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      'select-none',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      isDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={classes}
        {...rest}
      >
        {isLoading && (
          <span className="shrink-0">
            <Spinner size={spinnerSizeMap[size]} />
          </span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;