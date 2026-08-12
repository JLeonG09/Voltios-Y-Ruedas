import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'primary';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'gray', size = 'md', dot = false, children, className = '', ...props }, ref) => {
    const variantClasses = {
      success: 'bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-900/30 dark:text-brand-200 dark:border-brand-800',
      warning: 'bg-accent-50 text-accent-700 border border-accent-100 dark:bg-accent-900/30 dark:text-accent-200 dark:border-accent-800',
      danger: 'bg-danger-50 text-danger-700 border border-danger-100 dark:bg-danger-900/30 dark:text-danger-200 dark:border-danger-800',
      info: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800',
      gray: 'bg-surface-100 text-surface-700 border border-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:border-surface-700',
      primary: 'bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-900/30 dark:text-brand-200 dark:border-brand-800',
    };

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';