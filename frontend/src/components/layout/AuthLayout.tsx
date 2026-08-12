import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-6">
            <span className="text-white font-bold text-2xl">VyR</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Voltios y Ruedas</h1>
          <p className="text-surface-500 mt-1">Taller Automotriz</p>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          © 2026 Voltios y Ruedas. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};