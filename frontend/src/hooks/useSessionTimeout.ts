import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { preferenciasService } from '../services/preferenciasService';

const TIMEOUT_DEFAULT_MIN = 60;

/**
 * Sesión por inactividad: cualquier evento de actividad reinicia el temporizador
 * configurado (preferencia `sesionTimeout`), y al agotarse se cierra la sesión.
 * Además, el estado de autenticación se persiste en `sessionStorage` (ver
 * authStore): al cerrar o abandonar la pestaña, el navegador elimina esa sesión,
 * por lo que al volver a abrir la app se pide iniciar sesión de nuevo.
 */
export const useSessionTimeout = () => {
  const timerRef = useRef<number | null>(null);
  const ocultaDesdeRef = useRef<number | null>(null);

  const cerrarSesion = () => {
    const { refreshToken, logout } = useAuthStore.getState();
    // Revoca el refresh token en el backend (best-effort) antes de local logout.
    if (refreshToken) {
      const cuerpo = JSON.stringify({ refreshToken });
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: cuerpo,
        keepalive: true,
      }).catch(() => undefined);
    }
    logout();
    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  };

  useEffect(() => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;

    let timeoutMin = TIMEOUT_DEFAULT_MIN;
    let activo = true;

    preferenciasService
      .obtener()
      .then((prefs) => {
        if (activo && prefs.sesionTimeout) {
          timeoutMin = Number(prefs.sesionTimeout);
        }
      })
      .catch(() => undefined);

    const limpiarTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const armarTimer = () => {
      limpiarTimer();
      timerRef.current = window.setTimeout(cerrarSesion, timeoutMin * 60 * 1000);
    };

    const onActividad = () => armarTimer();
    const onVisibilidad = () => {
      if (document.hidden) {
        ocultaDesdeRef.current = Date.now();
        limpiarTimer();
      } else {
        const oculta = ocultaDesdeRef.current;
        ocultaDesdeRef.current = null;
        // Si la pestaña estuvo oculta (página abandonada) más que el límite, se cierra.
        if (oculta !== null && Date.now() - oculta > timeoutMin * 60 * 1000) {
          cerrarSesion();
          return;
        }
        armarTimer();
      }
    };

    armarTimer();

    const eventos: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'wheel',
    ];
    eventos.forEach((evento) => window.addEventListener(evento, onActividad, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilidad);

    return () => {
      activo = false;
      limpiarTimer();
      eventos.forEach((evento) => window.removeEventListener(evento, onActividad));
      document.removeEventListener('visibilitychange', onVisibilidad);
    };
  }, []);
};