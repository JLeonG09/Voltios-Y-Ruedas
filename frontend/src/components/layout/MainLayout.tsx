import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../store/authStore';

export const MainLayout = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={user.rol.nombre} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => {}} />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};