import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UsuarioResponse, JwtResponse } from '../types';

interface AuthState {
  user: UsuarioResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (response: JwtResponse) => void;
  setUser: (user: UsuarioResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (response: JwtResponse) =>
        set({
          user: {
            id: response.id,
            nombre: response.nombre,
            apellido: response.apellido,
            email: response.email,
            rol: { id: 0, nombre: response.rol },
            activo: true,
            fechaCreacion: '',
            fechaActualizacion: '',
          },
          token: response.token,
          isAuthenticated: true,
        }),
      setUser: (user: UsuarioResponse) =>
        set({ user }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);