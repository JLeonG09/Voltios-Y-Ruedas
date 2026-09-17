import { HTMLAttributes, forwardRef, Fragment, ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

const closeButtonClasses =
  'p-2 rounded-xl text-surface-400 transition-colors ' +
  'hover:text-surface-600 hover:bg-surface-100 ' +
  'dark:text-surface-400 dark:hover:text-surface-200 dark:hover:bg-surface-800 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] ' +
  'dark:focus-visible:ring-brand-400';

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      size = 'md',
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        document.body.style.overflow = 'hidden';
        modalRef.current?.focus();
      } else {
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'Escape' && closeOnEscape) {
          onClose();
        }
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements || focusableElements.length === 0) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[90vw]',
    };

    const setRefs = (node: HTMLDivElement | null) => {
      modalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    return (
      <Fragment>
        <div
          className="fixed inset-0 bg-surface-950/40 dark:bg-black/55 backdrop-blur-md z-50 animate-fade-in"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={setRefs}
          className={
            `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ` +
            `glass-panel rounded-2xl ` +
            `z-50 w-full ${sizeClasses[size]} flex flex-col max-h-[90vh] animate-scale-in ` +
            `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ` +
            `dark:focus-visible:ring-brand-400/40 ${className}`
          }
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          {...props}
        >
          {(title || showCloseButton) && (
            <div className="px-6 py-4 border-b border-white/35 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-50"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button type="button" onClick={onClose} className={closeButtonClasses} aria-label="Cerrar">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          <div className="p-6 overflow-y-auto">{children}</div>
        </div>
      </Fragment>
    );
  }
);

Modal.displayName = 'Modal';

const confirmVariantClasses = {
  danger:
    'bg-danger-600 hover:bg-danger-700 active:bg-danger-800 focus-visible:ring-danger-500 ' +
    'dark:bg-danger-600 dark:hover:bg-danger-500 dark:focus-visible:ring-danger-400',
  primary:
    'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 ' +
    'dark:bg-brand-500 dark:text-surface-950 dark:hover:bg-brand-400 dark:focus-visible:ring-brand-400',
  warning:
    'bg-accent-600 hover:bg-accent-700 active:bg-accent-800 focus-visible:ring-accent-500 ' +
    'dark:bg-accent-500 dark:text-surface-950 dark:hover:bg-accent-400 dark:focus-visible:ring-accent-400',
} as const;

const dialogBtnBase =
  'inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[var(--color-bg)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} onClose={loading ? () => undefined : onClose} title={title} size="sm" closeOnOverlayClick={!loading} closeOnEscape={!loading}>
      <p className="text-surface-600 dark:text-surface-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={
            `${dialogBtnBase} text-surface-700 dark:text-surface-200 ` +
            `bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 ` +
            `focus-visible:ring-surface-400 dark:focus-visible:ring-surface-500`
          }
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          aria-busy={loading || undefined}
          className={`${dialogBtnBase} text-white ${confirmVariantClasses[variant]}`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Procesando...
            </span>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
};
