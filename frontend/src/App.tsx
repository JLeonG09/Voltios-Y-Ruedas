import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ToastContainer } from './components/ui/ToastContainer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { RutaConRoles } from './components/auth/RutaConRoles';
import { useAuthStore } from './store/authStore';
import { useRevalidarSesion } from './hooks/useRevalidarSesion';
import {
  ROLES_AUTENTICADOS,
  ROLES_CLIENTE,
  ROLES_GESTION,
  ROLES_STAFF,
  rutaInicioPorRol,
} from './utils/roles';
import { Loader2 } from 'lucide-react';
import './index.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerificarEmailPage = lazy(() => import('./pages/VerificarEmailPage').then((m) => ({ default: m.VerificarEmailPage })));
const RecuperarPasswordPage = lazy(() => import('./pages/RecuperarPasswordPage'));
const ReestablecerPasswordPage = lazy(() => import('./pages/ReestablecerPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ReservasPage = lazy(() => import('./pages/ReservasPage').then((m) => ({ default: m.ReservasPage })));
const OrdenesPage = lazy(() => import('./pages/OrdenesPage').then((m) => ({ default: m.OrdenesPage })));
const InventarioPage = lazy(() => import('./pages/InventarioPage').then((m) => ({ default: m.InventarioPage })));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage').then((m) => ({ default: m.UsuariosPage })));
const ConfiguracionPage = lazy(() => import('./pages/ConfiguracionPage').then((m) => ({ default: m.ConfiguracionPage })));
const PerfilPage = lazy(() => import('./pages/PerfilPage'));
const MiVehiculoPage = lazy(() => import('./pages/MiVehiculoPage'));
const MiHistorialPage = lazy(() => import('./pages/MiHistorialPage'));
const MisReservasPage = lazy(() => import('./pages/MisReservasPage'));

const RutaRaiz = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <LandingPage />;
  return <Navigate to={rutaInicioPorRol(user?.rol?.nombre)} replace />;
};

const FallbackPagina = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
  </div>
);

const ErrorSesion = ({ onReintentar }: { onReintentar: () => void }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-surface-50 dark:bg-surface-900">
    <div className="max-w-md w-full bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-card p-8 text-center">
      <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-2">No se pudo validar la sesión</h1>
      <p className="text-surface-600 dark:text-surface-400 mb-6">
        No confirmamos tu usuario con el servidor. Reintenta para no usar un rol desactualizado.
      </p>
      <button
        type="button"
        onClick={onReintentar}
        className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  </div>
);

function App() {
  const { sesionLista, errorSesion, reintentar } = useRevalidarSesion();

  if (errorSesion) {
    return <ErrorSesion onReintentar={reintentar} />;
  }

  if (!sesionLista) {
    return <FallbackPagina />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<FallbackPagina />}>
          <Routes>
            <Route path="/" element={<RutaRaiz />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verificar-email" element={<VerificarEmailPage />} />
              <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
              <Route path="/reestablecer-password" element={<ReestablecerPasswordPage />} />
              <Route path="/reestablecer-password/:token" element={<ReestablecerPasswordPage />} />
            </Route>

            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<RutaConRoles roles={ROLES_STAFF}><DashboardPage /></RutaConRoles>} />
              <Route path="/reservas" element={<RutaConRoles roles={ROLES_STAFF}><ReservasPage /></RutaConRoles>} />
              <Route path="/ordenes" element={<RutaConRoles roles={ROLES_STAFF}><OrdenesPage /></RutaConRoles>} />
              <Route path="/inventario" element={<RutaConRoles roles={ROLES_STAFF}><InventarioPage /></RutaConRoles>} />
              <Route path="/usuarios" element={<RutaConRoles roles={ROLES_GESTION}><UsuariosPage /></RutaConRoles>} />
              <Route path="/configuracion" element={<RutaConRoles roles={ROLES_GESTION}><ConfiguracionPage /></RutaConRoles>} />
              <Route path="/perfil" element={<RutaConRoles roles={ROLES_AUTENTICADOS}><PerfilPage /></RutaConRoles>} />

              <Route path="/mi-vehiculo" element={<RutaConRoles roles={ROLES_CLIENTE}><MiVehiculoPage /></RutaConRoles>} />
              <Route path="/mi-historial" element={<RutaConRoles roles={ROLES_CLIENTE}><MiHistorialPage /></RutaConRoles>} />
              <Route path="/mis-reservas" element={<RutaConRoles roles={ROLES_CLIENTE}><MisReservasPage /></RutaConRoles>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
