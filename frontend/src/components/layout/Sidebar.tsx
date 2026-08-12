import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, ClipboardList, Package, Users, Settings,
  Car, History, Wrench, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const staffNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'JEFE_TALLER', 'MECANICO'] },
  { name: 'Reservas', href: '/reservas', icon: Calendar, roles: ['ADMIN', 'JEFE_TALLER', 'MECANICO'] },
  { name: 'Ordenes', href: '/ordenes', icon: ClipboardList, roles: ['ADMIN', 'JEFE_TALLER', 'MECANICO'] },
  { name: 'Inventario', href: '/inventario', icon: Package, roles: ['ADMIN', 'JEFE_TALLER', 'MECANICO'] },
  { name: 'Usuarios', href: '/usuarios', icon: Users, roles: ['ADMIN', 'JEFE_TALLER'] },
  { name: 'Configuracion', href: '/configuracion', icon: Settings, roles: ['ADMIN', 'JEFE_TALLER'] },
];

const clienteNav = [
  { name: 'Mi vehiculo', href: '/mi-vehiculo', icon: Car, roles: ['CLIENTE'] },
  { name: 'Mi historial', href: '/mi-historial', icon: History, roles: ['CLIENTE'] },
  { name: 'Mis reservas', href: '/mis-reservas', icon: Calendar, roles: ['CLIENTE'] },
];

interface SidebarProps {
  userRole: string;
}

export const Sidebar = ({ userRole }: SidebarProps) => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();
  const items = userRole === 'CLIENTE' ? clienteNav : staffNav;
  const filteredNavigation = items.filter((item) => item.roles.includes(userRole));

  return (
    <>
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navegacion principal"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200 dark:border-surface-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">VyR</span>
              </div>
              <span className="font-semibold text-surface-900 dark:text-white text-lg hidden sm:block">Voltios y Ruedas</span>
            </div>
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800 transition-colors"
              onClick={toggleSidebar}
              aria-label="Cerrar menu"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Menu principal">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 shadow-card' : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800'}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-surface-200 dark:border-surface-800">
            <div className="px-3 py-2 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
              <Wrench className="h-3.5 w-3.5" /> Taller Voltios y Ruedas
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden animate-fade-in"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
};