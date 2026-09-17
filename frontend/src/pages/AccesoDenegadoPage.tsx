import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { rutaInicioPorRol } from '../utils/roles';

export const AccesoDenegadoPage = () => {
  const rol = useAuthStore((s) => s.user?.rol?.nombre);
  const inicio = rutaInicioPorRol(rol);

  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
      <div className="empty-state max-w-md px-4">
        <ShieldOff className="empty-state-icon text-danger-500 dark:text-danger-400" aria-hidden="true" />
        <h1 className="empty-state-title">Acceso denegado</h1>
        <p className="empty-state-text">
          No tienes permiso para ver esta página. Si llegaste por un enlace, tu rol no incluye esta
          sección.
        </p>
        <Link
          to={inicio}
          replace
          className={
            `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ` +
            `bg-brand-600 text-white shadow-card transition-colors ` +
            `hover:bg-brand-700 ` +
            `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ` +
            `focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] ` +
            `dark:bg-brand-500 dark:text-surface-950 dark:hover:bg-brand-400 dark:focus-visible:ring-brand-400`
          }
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};
