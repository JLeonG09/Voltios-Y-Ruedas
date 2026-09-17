import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[var(--color-bg)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none';

const variantClasses = {
  primary:
    'bg-brand-600 text-white shadow-card ' +
    'hover:bg-brand-700 hover:shadow-card-hover active:bg-brand-800 ' +
    'focus-visible:ring-brand-500 ' +
    'dark:bg-brand-500 dark:text-surface-950 dark:hover:bg-brand-400 dark:active:bg-brand-600 dark:focus-visible:ring-brand-400',
  secondary:
    'bg-surface-100 text-surface-700 border border-surface-200 ' +
    'hover:bg-surface-200 active:bg-surface-300 ' +
    'focus-visible:ring-surface-400 ' +
    'dark:bg-surface-800 dark:text-surface-200 dark:border-surface-700 ' +
    'dark:hover:bg-surface-700 dark:active:bg-surface-600 dark:focus-visible:ring-surface-500',
  danger:
    'bg-danger-600 text-white shadow-card ' +
    'hover:bg-danger-700 hover:shadow-card-hover active:bg-danger-800 ' +
    'focus-visible:ring-danger-500 ' +
    'dark:bg-danger-600 dark:hover:bg-danger-500 dark:active:bg-danger-700 dark:focus-visible:ring-danger-400',
  outline:
    'border-2 border-surface-300 text-surface-700 bg-transparent ' +
    'hover:bg-surface-50 active:bg-surface-100 ' +
    'focus-visible:ring-surface-400 ' +
    'dark:border-surface-600 dark:text-surface-200 ' +
    'dark:hover:bg-surface-800 dark:active:bg-surface-700 dark:focus-visible:ring-surface-500',
  ghost:
    'text-surface-600 bg-transparent ' +
    'hover:bg-surface-100 active:bg-surface-200 ' +
    'focus-visible:ring-surface-400 ' +
    'dark:text-surface-300 dark:hover:bg-surface-800 dark:active:bg-surface-700 dark:focus-visible:ring-surface-500',
} as const;

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  icon: 'p-2',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', type = 'button', ...props }, ref) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
