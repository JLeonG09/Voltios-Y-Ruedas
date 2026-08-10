import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, action, children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`} {...props}>
        {(title || action) && (
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`px-6 py-4 border-b border-gray-100 ${className}`} {...props}>
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
      <div ref={ref} className={`px-6 py-4 border-t border-gray-100 bg-gray-50 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';