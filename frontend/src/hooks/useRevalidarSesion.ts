import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export function esperarHidratacionPersist(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsuscribir = useAuthStore.persist.onFinishHydration(() => {
      unsuscribir();
      resolve();
    });
    if (useAuthStore.persist.hasHydrated()) {
      unsuscribir();
      resolve();
    }
  });
}

export function useRevalidarSesion() {
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando');

  const revalidar = useCallback(async () => {
    setEstado('cargando');
    await esperarHidratacionPersist();
    const { token, isAuthenticated, setUser } = useAuthStore.getState();
    if (!isAuthenticated || !token) {
      setEstado('lista');
      return;
    }
    try {
      const usuario = await authService.getCurrentUser();
      setUser(usuario);
      setEstado('lista');
    } catch {
      if (!useAuthStore.getState().isAuthenticated) {
        setEstado('lista');
        return;
      }
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    void revalidar();
  }, [revalidar]);

  return {
    sesionLista: estado === 'lista',
    errorSesion: estado === 'error',
    reintentar: revalidar,
  };
}
