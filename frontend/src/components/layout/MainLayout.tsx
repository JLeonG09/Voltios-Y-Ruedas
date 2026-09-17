import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar, Header } from './index';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

export const MainLayout = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  useSessionTimeout();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => {
      if (mq.matches) {
        setSidebarOpen(false);
      } else {
        try {
          const saved = localStorage.getItem('sidebarOpen');
          setSidebarOpen(saved === null ? true : JSON.parse(saved) === true);
        } catch {
          setSidebarOpen(true);
        }
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [setSidebarOpen]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell relative min-h-dvh text-[var(--color-fg)]">
      <div className="app-shell-bg" aria-hidden="true">
        <span className="app-shell-orb app-shell-orb-a" />
        <span className="app-shell-orb app-shell-orb-b" />
        <span className="app-shell-orb app-shell-orb-c" />
        <span className="app-shell-noise" />
      </div>

      <Sidebar userRole={user.rol.nombre} />

      <div
        className={
          `relative z-10 flex min-h-dvh flex-col transition-[padding] duration-300 ease-out ` +
          `${sidebarOpen ? 'lg:pl-72' : 'lg:pl-0'}`
        }
      >
        <Header onMenuClick={toggleSidebar} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
