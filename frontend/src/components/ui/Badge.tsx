import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantClasses = {
  success:
    'bg-brand-50 text-brand-700 border-brand-100 ' +
    'dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-800',
  warning:
    'bg-accent-50 text-accent-700 border-accent-100 ' +
    'dark:bg-accent-900/40 dark:text-accent-200 dark:border-accent-800',
  danger:
    'bg-danger-50 text-danger-700 border-danger-100 ' +
    'dark:bg-danger-900/40 dark:text-danger-200 dark:border-danger-800',
  info:
    'bg-blue-50 text-blue-700 border-blue-100 ' +
    'dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800',
  gray:
    'bg-surface-100 text-surface-700 border-surface-200 ' +
    'dark:bg-surface-800 dark:text-surface-200 dark:border-surface-700',
  primary:
    'bg-brand-50 text-brand-700 border-brand-100 ' +
    'dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-800',
} as const;

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
} as const;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'gray', size = 'md', dot = false, children, className = '', ...props }, ref) => {
    const interactive = props.onClick != null || props.onKeyDown != null || props.tabIndex != null;

    return (
      <span
        ref={ref}
        className={
          `inline-flex items-center gap-1.5 rounded-full font-medium border transition-colors duration-150 ` +
          `${variantClasses[variant]} ${sizeClasses[size]} ` +
          (interactive
            ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
              'focus-visible:ring-offset-[var(--color-bg)] focus-visible:ring-brand-500 ' +
              'dark:focus-visible:ring-brand-400'
            : '') +
          ` ${className}`
        }
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
