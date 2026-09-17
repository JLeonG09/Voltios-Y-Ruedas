import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export const AuthLayout = () => {
  return (
    <div className="app-shell relative flex min-h-dvh items-center justify-center overflow-hidden p-4 text-[var(--color-fg)]">
      <div className="app-shell-bg" aria-hidden="true">
        <span className="app-shell-orb app-shell-orb-a" />
        <span className="app-shell-orb app-shell-orb-b" />
        <span className="app-shell-orb app-shell-orb-c" />
        <span className="app-shell-noise" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
        <p className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
          © 2026 Voltios y Ruedas. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
