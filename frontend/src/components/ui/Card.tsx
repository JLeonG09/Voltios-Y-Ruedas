import { HTMLAttributes, forwardRef, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  padding?: 'none' | 'default' | 'sm';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, action, children, className = '', padding = 'default', ...props }, ref) => {
    const paddingClasses = {
      none: '',
      default: 'p-6',
      sm: 'p-4',
    };

    return (
      <div
        ref={ref}
        className={
          `glass-panel-soft rounded-2xl overflow-hidden transition-[box-shadow,border-color] duration-200 ` +
          `hover:shadow-card ` +
          `focus-within:border-brand-500/40 dark:focus-within:border-brand-400/30 ` +
          `${className}`
        }
        {...props}
      >
        {(title || action) && (
          <div className="px-6 py-4 border-b border-white/35 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {title && (
                <h3 className="text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-50">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        <div className={paddingClasses[padding]}>{children}</div>
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 border-b border-surface-100 dark:border-surface-800 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`p-6 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={
          `px-6 py-4 border-t border-surface-100 dark:border-surface-800 ` +
          `bg-surface-50 dark:bg-surface-950/60 flex items-center gap-3 ${className}`
        }
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={`text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-50 ${className}`}
        {...props}
      />
    );
  }
);

CardTitle.displayName = 'CardTitle';
