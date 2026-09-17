import { PanelLeft, PanelLeftClose, User, LogOut, Bell, ChevronDown, Moon, Sun, Inbox } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { notificacionesService } from '../../services/notificacionesService';
import { authService } from '../../services/authService';
import type { Notificacion } from '../../types';

interface HeaderProps {
  onMenuClick: () => void;
}

const formatearTiempo = (fecha: string): string => {
  const diffMs = Date.now() - new Date(fecha).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
  return new Date(fecha).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
};

const iconBtn =
  `relative inline-flex h-10 w-10 items-center justify-center rounded-xl ` +
  `text-surface-500 transition-colors ` +
  `hover:bg-white/55 hover:text-surface-800 ` +
  `dark:text-surface-400 dark:hover:bg-white/10 dark:hover:text-surface-100 ` +
  `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ` +
  `focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ` +
  `dark:focus-visible:ring-brand-400`;

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout, refreshToken } = useAuthStore();
  const { darkMode, toggleDarkMode, sidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const [lista, conteo] = await Promise.all([
        notificacionesService.listar(),
        notificacionesService.contarNoLeidas(),
      ]);
      setNotifications(lista);
      setNoLeidas(conteo);
    } catch {
      setNotifications([]);
      setNoLeidas(0);
    } finally {
      setLoadingNotif(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let activo = true;
    const fetchNotificaciones = async () => {
      try {
        const [lista, conteo] = await Promise.all([
          notificacionesService.listar(),
          notificacionesService.contarNoLeidas(),
        ]);
        if (!activo) return;
        setNotifications(lista);
        setNoLeidas(conteo);
      } catch {
        if (!activo) return;
        setNotifications([]);
        setNoLeidas(0);
      } finally {
        if (activo) setLoadingNotif(false);
      }
    };
    void fetchNotificaciones();
    return () => {
      activo = false;
    };
  }, [user]);

  useEffect(() => {
    if (!showNotifications && !showUserMenu) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showNotifications && notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (showUserMenu && userRef.current && !userRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [showNotifications, showUserMenu]);

  const handleLogout = async () => {
    logout();
    try {
      await authService.logout(refreshToken ?? undefined);
    } catch {
      // El cierre local ya se aplicó; el backend termina invalidando el token igual.
    }
    navigate('/');
  };

  const marcarLeida = async (id: number) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.leida) {
      setNoLeidas((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
      try {
        await notificacionesService.marcarLeida(id);
      } catch {
        await cargarNotificaciones();
      }
    }
  };

  const marcarTodas = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
    try {
      await notificacionesService.marcarTodasLeidas();
    } catch {
      await cargarNotificaciones();
    }
  };

  const nombreVisible = user?.nombreCompleto || user?.nombre || 'Usuario';

  return (
    <header className="sticky top-0 z-30 glass-panel rounded-none border-x-0 border-t-0">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className={iconBtn}
            onClick={onMenuClick}
            aria-label={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
            title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeft className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <div className={`min-w-0 ${sidebarOpen ? 'lg:hidden' : ''}`}>
            <p className="truncate text-sm font-semibold tracking-tight text-surface-900 dark:text-surface-50">
              Voltios y Ruedas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className={iconBtn}
              onClick={() => {
                setShowNotifications((v) => !v);
                setShowUserMenu(false);
              }}
              aria-label="Notificaciones"
              aria-expanded={showNotifications}
              aria-haspopup="true"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {noLeidas > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold leading-none text-white">
                  {noLeidas > 99 ? '99+' : noLeidas}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className={
                  `fixed right-3 top-[3.75rem] z-50 w-[calc(100vw-1.5rem)] max-w-80 overflow-hidden ` +
                  `rounded-2xl border border-surface-200 bg-white shadow-elevated ` +
                  `dark:border-surface-700 dark:bg-surface-900 ` +
                  `sm:absolute sm:right-0 sm:top-auto sm:mt-2 animate-slide-down`
                }
                role="menu"
                aria-label="Lista de notificaciones"
              >
                <div className="flex items-center justify-between gap-2 border-b border-surface-100 px-4 py-3 dark:border-surface-800">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">Notificaciones</h3>
                  {noLeidas > 0 && (
                    <button
                      type="button"
                      className={
                        `text-xs font-medium text-brand-700 hover:text-brand-800 ` +
                        `dark:text-brand-300 dark:hover:text-brand-200 ` +
                        `focus:outline-none focus-visible:underline`
                      }
                      onClick={marcarTodas}
                    >
                      Marcar todas
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {loadingNotif && (
                    <p className="px-4 py-8 text-center text-sm text-surface-400">Cargando…</p>
                  )}
                  {!loadingNotif && notifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <Inbox className="mx-auto mb-2 h-8 w-8 text-surface-300 dark:text-surface-600" aria-hidden="true" />
                      <p className="text-sm text-surface-500 dark:text-surface-400">No tienes notificaciones</p>
                    </div>
                  )}
                  {!loadingNotif &&
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        role="menuitem"
                        onClick={() => marcarLeida(notif.id)}
                        className={
                          `w-full px-4 py-3 text-left transition-colors ` +
                          `hover:bg-surface-50 dark:hover:bg-surface-800/80 ` +
                          `focus:outline-none focus-visible:bg-surface-50 dark:focus-visible:bg-surface-800 ` +
                          `${!notif.leida ? 'bg-brand-50/40 dark:bg-brand-900/15' : ''}`
                        }
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              !notif.leida ? 'bg-brand-500' : 'bg-surface-300 dark:bg-surface-600'
                            }`}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-medium ${
                                !notif.leida
                                  ? 'text-surface-900 dark:text-surface-50'
                                  : 'text-surface-700 dark:text-surface-300'
                              }`}
                            >
                              {notif.titulo}
                            </p>
                            {notif.mensaje && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-surface-500 dark:text-surface-400">
                                {notif.mensaje}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-surface-400 dark:text-surface-500">
                              {formatearTiempo(notif.fecha)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className={iconBtn}
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
          </button>

          <div className="relative" ref={userRef}>
            <button
              type="button"
              className={
                `flex max-w-[12rem] items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors ` +
                `hover:bg-surface-100 dark:hover:bg-surface-800 ` +
                `focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ` +
                `focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] ` +
                `dark:focus-visible:ring-brand-400`
              }
              onClick={() => {
                setShowUserMenu((v) => !v);
                setShowNotifications(false);
              }}
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                <User className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden min-w-0 truncate text-sm font-medium text-surface-700 dark:text-surface-200 sm:block">
                {nombreVisible}
              </span>
              <ChevronDown className="hidden h-4 w-4 shrink-0 text-surface-400 sm:block" aria-hidden="true" />
            </button>

            {showUserMenu && (
              <div
                className={
                  `absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border ` +
                  `border-surface-200 bg-white py-1 shadow-elevated animate-slide-down ` +
                  `dark:border-surface-700 dark:bg-surface-900`
                }
                role="menu"
                aria-label="Menu de usuario"
              >
                <div className="border-b border-surface-100 px-4 py-3 dark:border-surface-800">
                  <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">{nombreVisible}</p>
                  <p className="truncate text-xs text-surface-500 dark:text-surface-400">{user?.email}</p>
                  {user?.rol?.nombre && (
                    <span className="mt-2 inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                      {user.rol.nombre}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className={
                    `flex w-full items-center gap-2 px-4 py-2.5 text-sm text-surface-700 ` +
                    `hover:bg-surface-50 dark:text-surface-200 dark:hover:bg-surface-800 ` +
                    `focus:outline-none focus-visible:bg-surface-50 dark:focus-visible:bg-surface-800`
                  }
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/perfil');
                  }}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Mi perfil
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={
                    `flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger-600 ` +
                    `hover:bg-danger-50 dark:text-danger-300 dark:hover:bg-danger-950/40 ` +
                    `focus:outline-none focus-visible:bg-danger-50 dark:focus-visible:bg-danger-950/40`
                  }
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
