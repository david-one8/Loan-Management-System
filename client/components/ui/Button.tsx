import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-brand-600 text-white shadow-sm',
    'hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md',
    'active:bg-brand-800 focus-visible:ring-brand-500',
  ].join(' '),
  secondary: [
    'border border-slate-300 bg-white text-slate-700 shadow-sm',
    'hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-card',
    'focus-visible:ring-slate-400',
    'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700',
  ].join(' '),
  danger: [
    'bg-danger-600 text-white shadow-sm',
    'hover:-translate-y-0.5 hover:bg-danger-700 hover:shadow-md',
    'active:bg-danger-800 focus-visible:ring-danger-500',
  ].join(' '),
  ghost: [
    'text-slate-600',
    'hover:bg-slate-100 hover:text-slate-900',
    'focus-visible:ring-slate-400',
    'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  ].join(' '),
  success: [
    'bg-success-600 text-white shadow-sm',
    'hover:-translate-y-0.5 hover:bg-success-700 hover:shadow-md',
    'active:bg-success-800 focus-visible:ring-success-500',
  ].join(' '),
  link: [
    'h-auto p-0 text-brand-600 underline-offset-4',
    'hover:text-brand-700 hover:underline focus-visible:ring-brand-500',
    'dark:text-brand-400 dark:hover:text-brand-300',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs rounded-md',
  sm: 'px-3.5 py-2 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-5 py-3 text-base rounded-xl',
  xl: 'px-6 py-3.5 text-base rounded-xl',
};

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
      'inline-flex items-center justify-center gap-2 font-medium',
      'transition-all duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'dark:focus-visible:ring-offset-slate-900',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:transform-none',
      'active:scale-[0.98] select-none',
      variantClasses[variant],
      variant === 'link' ? '' : sizeClasses[size],
      fullWidth ? 'w-full' : '',
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
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? 'Please wait...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
