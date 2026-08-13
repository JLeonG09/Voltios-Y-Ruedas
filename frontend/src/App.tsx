import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, type ReactElement } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ToastContainer } from './components/ui/ToastContainer';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';
import './index.css';

// Code-splitting: cada página se carga bajo demanda (React.lazy + Suspense)
// para reducir el tamaño del bundle inicial y eliminar el warning de chunk > 500 kB.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerificarEmailPage = lazy(() => import('./pages/VerificarEmailPage').then((m) => ({ default: m.VerificarEmailPage })));
const RecuperarPasswordPage = lazy(() => import('./pages/RecuperarPasswordPage'));
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
  if (user?.rol?.nombre === 'CLIENTE') return <Navigate to="/mi-vehiculo" replace />;
  return <Navigate to="/dashboard" replace />;
};

const RutaCliente = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.rol?.nombre !== 'CLIENTE') return <Navigate to="/dashboard" replace />;
  return children;
};

const RutaStaff = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.rol?.nombre === 'CLIENTE') return <Navigate to="/mi-vehiculo" replace />;
  return children;
};

const RutaProtegida = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

const FallbackPagina = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FallbackPagina />}>
        <Routes>
          <Route path="/" element={<RutaRaiz />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verificar-email" element={<VerificarEmailPage />} />
            <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
          </Route>

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<RutaStaff><DashboardPage /></RutaStaff>} />
            <Route path="/reservas" element={<RutaStaff><ReservasPage /></RutaStaff>} />
            <Route path="/ordenes" element={<RutaStaff><OrdenesPage /></RutaStaff>} />
            <Route path="/inventario" element={<RutaStaff><InventarioPage /></RutaStaff>} />
            <Route path="/usuarios" element={<RutaStaff><UsuariosPage /></RutaStaff>} />
            <Route path="/configuracion" element={<RutaStaff><ConfiguracionPage /></RutaStaff>} />
            <Route path="/perfil" element={<RutaProtegida><PerfilPage /></RutaProtegida>} />

            <Route path="/mi-vehiculo" element={<RutaCliente><MiVehiculoPage /></RutaCliente>} />
            <Route path="/mi-historial" element={<RutaCliente><MiHistorialPage /></RutaCliente>} />
            <Route path="/mis-reservas" element={<RutaCliente><MisReservasPage /></RutaCliente>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {/* Contenedor global de notificaciones: se monta una sola vez y
          sobrevive a cualquier navegación. Escucha el array de Zustand. */}
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
