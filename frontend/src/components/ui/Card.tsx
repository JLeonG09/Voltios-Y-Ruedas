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
      <div ref={ref} className={`bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card overflow-hidden transition-all duration-300 hover:shadow-card-hover ${className}`} {...props}>
        {(title || action) && (
          <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h3>}
              {subtitle && <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
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
      <div ref={ref} className={`px-6 py-4 border-b border-surface-100 dark:border-surface-800 ${className}`} {...props}>
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
      <div ref={ref} className={`px-6 py-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50 flex items-center gap-3 ${className}`} {...props}>
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
      <h3 ref={ref} className={`text-lg font-semibold text-surface-900 dark:text-white ${className}`} {...props} />
    );
  }
);

CardTitle.displayName = 'CardTitle';