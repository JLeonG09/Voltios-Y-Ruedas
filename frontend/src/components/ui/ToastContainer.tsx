import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore, type Notification } from '../../store/uiStore';

/**
 * Contenedor global de notificaciones (toasts).
 *
 * - Se monta una sola vez en App.tsx.
 * - Lee el array `notifications` del uiStore de Zustand.
 * - Cada notificación se auto-cierra tras `duration` ms (default 4000).
 * - Permite cierre manual con el botón X.
 * - Se renderiza fuera del árbol normal (portal) para evitar que el
 *   `overflow: hidden` de cualquier layout la tape.
 */
export const ToastContainer = () => {
  const { notifications, removeNotification } = useUIStore();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Aseguramos que existe un nodo donde colgar el portal.
    let root = document.getElementById('toast-portal');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-portal';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
  }, []);

  if (!portalRoot) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((n) => (
        <ToastItem
          key={n.id}
          notification={n}
          onClose={() => removeNotification(n.id)}
        />
      ))}
    </div>,
    portalRoot
  );
};

interface ToastItemProps {
  notification: Notification;
  onClose: () => void;
}

const DURATIONS: Record<Notification['type'], number> = {
  success: 3500,
  error: 6000,
  warning: 5000,
  info: 4000,
};

const STYLES: Record<
  Notification['type'],
  { container: string; icon: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    container: 'bg-white dark:bg-surface-900 border-emerald-200 dark:border-emerald-800 text-surface-900 dark:text-white shadow-card',
    icon: 'text-emerald-500',
    Icon: CheckCircle2,
  },
  error: {
    container: 'bg-white dark:bg-surface-900 border-danger-200 dark:border-danger-800 text-surface-900 dark:text-white shadow-card',
    icon: 'text-danger-500',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-white dark:bg-surface-900 border-amber-200 dark:border-amber-800 text-surface-900 dark:text-white shadow-card',
    icon: 'text-amber-500',
    Icon: AlertTriangle,
  },
  info: {
    container: 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-900 dark:text-white shadow-card',
    icon: 'text-brand-500',
    Icon: Info,
  },
};

const ToastItem = ({ notification, onClose }: ToastItemProps) => {
  const style = STYLES[notification.type];
  const { Icon } = style;
  const duration = notification.duration ?? DURATIONS[notification.type];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto rounded-xl border px-4 py-3 flex items-start gap-3 ${style.container}`}
    >
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-5">{notification.title}</p>
        {notification.message && (
          <p className="text-sm text-surface-600 dark:text-surface-300 mt-0.5 break-words">
            {notification.message}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
