import { Menu, User, LogOut, Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={onMenuClick}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones"
            aria-expanded={showNotifications}
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.nombreCompleto || 'Usuario'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.nombreCompleto}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.rol?.nombre?.toLowerCase()}</p>
                </div>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => navigate('/perfil')}
                >
                  <User className="h-4 w-4" />
                  Mi perfil
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}