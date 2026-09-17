import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { rutaInicioPorRol } from '../utils/roles';

export const AccesoDenegadoPage = () => {
  const rol = useAuthStore((s) => s.user?.rol?.nombre);
  const inicio = rutaInicioPorRol(rol);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-danger-600 dark:text-danger-400" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Acceso denegado</h1>
        <p className="text-surface-600 dark:text-surface-400 mb-6">
          No tienes permiso para ver esta página. Si llegaste por un enlace, tu rol no incluye esta sección.
        </p>
        <Link
          to={inicio}
          replace
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};
