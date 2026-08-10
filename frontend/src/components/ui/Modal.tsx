import { Fragment, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
}: ModalProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            aria-hidden="true"
            onClick={handleOverlayClick}
          />
          
          <div
            className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all`}
            onKeyDown={handleKeyDown}
          >
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};