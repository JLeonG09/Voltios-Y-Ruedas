import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  Package, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'JEFE_TALLER', 'MECANICO', 'CLIENTE'] },
  { name: 'Reservas', href: '/reservas', icon: Calendar, roles: ['ADMIN', 'JEFE_TALLER', 'MECANICO', 'CLIENTE'] },
  { name: 'Órdenes', href: '/ordenes', icon: ClipboardList, roles: ['ADMIN', 'JEFE_TALLER', 'MECANICO'] },
  { name: 'Inventario', href: '/inventario', icon: Package, roles: ['ADMIN', 'JEFE_TALLER', 'MECANICO'] },
  { name: 'Usuarios', href: '/usuarios', icon: Users, roles: ['ADMIN'] },
  { name: 'Configuración', href: '/configuracion', icon: Settings, roles: ['ADMIN', 'JEFE_TALLER'] },
];

interface SidebarProps {
  userRole: string;
}

export const Sidebar = ({ userRole }: SidebarProps) => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();
  
  const filteredNavigation = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <>
      <button
        type="button"
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {sidebarOpen ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
      </button>
      
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navegación principal"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">VyR</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg hidden sm:block">Voltios y Ruedas</span>
            </div>
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={toggleSidebar}
              aria-label="Cerrar menú"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Menú principal">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Versión 1.0.0
              </p>
            </div>
          </div>
        </div>
      </aside>
      
      {!sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
};