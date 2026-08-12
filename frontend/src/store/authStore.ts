import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UsuarioResponse, JwtResponse } from '../types';

interface AuthState {
  user: UsuarioResponse | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (response: JwtResponse) => void;
  setTokens: (token: string, refreshToken: string) => void;
  setUser: (user: UsuarioResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
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
          refreshToken: response.refreshToken ?? null,
          isAuthenticated: true,
        }),
      setTokens: (token: string, refreshToken: string) =>
        set({ token, refreshToken }),
      setUser: (user: UsuarioResponse) =>
        set({ user }),
      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
