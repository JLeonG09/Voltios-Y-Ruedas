import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Package,
  Users,
  Settings,
  Car,
  History,
  PanelLeftClose,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { ROLES, ROLES_CLIENTE, ROLES_GESTION, ROLES_STAFF, rolPermitido } from '../../utils/roles';
import type { NombreRol } from '../../types';

const staffNav: { name: string; href: string; icon: typeof LayoutDashboard; roles: readonly NombreRol[] }[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ROLES_STAFF },
  { name: 'Reservas', href: '/reservas', icon: Calendar, roles: ROLES_STAFF },
  { name: 'Órdenes', href: '/ordenes', icon: ClipboardList, roles: ROLES_STAFF },
  { name: 'Inventario', href: '/inventario', icon: Package, roles: ROLES_STAFF },
  { name: 'Usuarios', href: '/usuarios', icon: Users, roles: ROLES_GESTION },
  { name: 'Configuración', href: '/configuracion', icon: Settings, roles: ROLES_GESTION },
];

const clienteNav: { name: string; href: string; icon: typeof LayoutDashboard; roles: readonly NombreRol[] }[] = [
  { name: 'Mi vehículo', href: '/mi-vehiculo', icon: Car, roles: ROLES_CLIENTE },
  { name: 'Mi historial', href: '/mi-historial', icon: History, roles: ROLES_CLIENTE },
  { name: 'Mis reservas', href: '/mis-reservas', icon: Calendar, roles: ROLES_CLIENTE },
];

interface SidebarProps {
  userRole: string;
}

const esRutaActiva = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const esMovil = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

export const Sidebar = ({ userRole }: SidebarProps) => {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const items = userRole === ROLES.CLIENTE ? clienteNav : staffNav;
  const filteredNavigation = items.filter((item) => rolPermitido(userRole, item.roles));

  // En móvil se cierra al navegar; en desktop se conserva el estado.
  useEffect(() => {
    if (esMovil()) setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      <aside
        id="app-sidebar"
        className={
          `fixed top-0 left-0 z-40 flex h-dvh w-[min(18rem,88vw)] flex-col glass-chrome ` +
          `transition-transform duration-300 ease-out ` +
          `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        }
        aria-label="Navegación principal"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/35 px-4 dark:border-white/10">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold tracking-tight text-white shadow-card dark:bg-brand-500 dark:text-surface-950"
            aria-hidden="true"
          >
            VyR
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-surface-900 dark:text-surface-50">
              Voltios y Ruedas
            </p>
            <p className="truncate text-[11px] text-surface-500 dark:text-surface-400">Taller</p>
          </div>
          <button
            type="button"
            className={
              `rounded-xl p-2 text-surface-500 transition-colors ` +
              `hover:bg-white/50 hover:text-surface-800 ` +
              `dark:text-surface-400 dark:hover:bg-white/10 dark:hover:text-surface-100 ` +
              `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ` +
              `focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`
            }
            onClick={toggleSidebar}
            aria-label="Ocultar menú"
          >
            <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Menú
          </p>
          <ul className="space-y-0.5">
            {filteredNavigation.map((item) => {
              const isActive = esRutaActiva(location.pathname, item.href);
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/dashboard' || item.href === '/mi-vehiculo'}
                    tabIndex={sidebarOpen ? 0 : -1}
                    className={
                      `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ` +
                      `transition-colors duration-150 ` +
                      `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ` +
                      `focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ` +
                      (isActive
                        ? 'bg-brand-500/15 text-brand-800 dark:bg-brand-400/15 dark:text-brand-200'
                        : 'text-surface-600 hover:bg-white/55 hover:text-surface-900 ' +
                          'dark:text-surface-400 dark:hover:bg-white/8 dark:hover:text-surface-100')
                    }
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-brand-600 dark:bg-brand-400"
                        aria-hidden="true"
                      />
                    )}
                    <item.icon
                      className={
                        `h-[1.15rem] w-[1.15rem] shrink-0 ${
                          isActive
                            ? 'text-brand-700 dark:text-brand-300'
                            : 'text-surface-400 group-hover:text-surface-600 dark:text-surface-500 dark:group-hover:text-surface-300'
                        }`
                      }
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-surface-950/35 backdrop-blur-[3px] lg:hidden animate-fade-in"
          onClick={toggleSidebar}
          aria-label="Cerrar menú"
        />
      )}
    </>
  );
};
