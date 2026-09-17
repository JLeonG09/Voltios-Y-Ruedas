import { Menu, User, LogOut, Bell, ChevronDown, Moon, Sun, Home, Inbox } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { notificacionesService } from '../../services/notificacionesService';
import { authService } from '../../services/authService';
import { rutaInicioPorRol } from '../../utils/roles';
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

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout, refreshToken } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(true);

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

  const handleLogout = async () => {
    logout();
    try {
      await authService.logout(refreshToken ?? undefined);
    } catch {
      // El cierre local ya se aplicó; el backend termina invalidando el token igual.
    }
    navigate('/');
  };

  const handleHome = () => {
    navigate(rutaInicioPorRol(user?.rol?.nombre));
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

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800 transition-colors"
            onClick={onMenuClick}
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-white dark:hover:bg-surface-800 transition-colors"
            onClick={handleHome}
            aria-label="Inicio"
          >
            <Home className="h-4 w-4" />
            Inicio
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              className="relative p-2 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificaciones"
              aria-expanded={showNotifications}
            >
              <Bell className="h-6 w-6" />
              {noLeidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {noLeidas > 99 ? '99+' : noLeidas}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed right-4 top-16 w-[calc(100vw-2rem)] max-w-80 sm:absolute sm:right-0 sm:top-auto sm:mt-2 bg-white dark:bg-surface-900 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 py-1 z-50 animate-slide-down">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                  <h3 className="font-semibold text-surface-900 dark:text-white">Notificaciones</h3>
                  {noLeidas > 0 && (
                    <button
                      type="button"
                      className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-300"
                      onClick={marcarTodas}
                    >
                      Marcar todas
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loadingNotif && (
                    <p className="px-4 py-6 text-center text-sm text-surface-400">Cargando…</p>
                  )}
                  {!loadingNotif && notifications.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Inbox className="h-8 w-8 mx-auto mb-2 text-surface-300 dark:text-surface-600" />
                      <p className="text-sm text-surface-500 dark:text-surface-400">No tienes notificaciones</p>
                    </div>
                  )}
                  {!loadingNotif && notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => marcarLeida(notif.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors ${!notif.leida ? 'bg-brand-50/50 dark:bg-brand-900/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!notif.leida ? 'bg-brand-500' : 'bg-surface-300 dark:bg-surface-600'}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${!notif.leida ? 'text-surface-900 dark:text-white' : 'text-surface-700 dark:text-surface-300'}`}>{notif.titulo}</p>
                          {notif.mensaje && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2">{notif.mensaje}</p>
                          )}
                          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{formatearTiempo(notif.fecha)}</p>
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
            className="p-2 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800 transition-colors"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                <User className="h-5 w-5 text-brand-600 dark:text-brand-300" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-surface-700 dark:text-surface-200">
                {user?.nombreCompleto || user?.nombre || 'Usuario'}
              </span>
              <ChevronDown className="h-4 w-4 text-surface-500 dark:text-surface-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-900 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 py-1 z-50 animate-slide-down">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                  <p className="text-sm font-medium text-surface-900 dark:text-white">{user?.nombreCompleto || user?.nombre}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{user?.email}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-200 mt-1">
                    {user?.rol?.nombre}
                  </span>
                </div>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800"
                  onClick={() => navigate('/perfil')}
                >
                  <User className="h-4 w-4" />
                  Mi perfil
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 dark:text-danger-300 hover:bg-surface-50 dark:hover:bg-surface-800"
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
};
