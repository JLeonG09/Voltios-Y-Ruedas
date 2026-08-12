import { Outlet } from 'react-router-dom';
import { Sidebar, Header } from './index';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export const MainLayout = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  if (!isAuthenticated || !user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar userRole={user.rol.nombre} />
      <div className="lg:pl-64">
        <Header onMenuClick={toggleSidebar} />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};