import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { JwtResponse } from '../types';

const jwtResponse: JwtResponse = {
  token: 'access-token-123',
  tipo: 'Bearer',
  id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@example.com',
  rol: 'CLIENTE',
  refreshToken: 'refresh-token-abc',
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('login almacena token, refreshToken y usuario', () => {
    useAuthStore.getState().login(jwtResponse);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('access-token-123');
    expect(state.refreshToken).toBe('refresh-token-abc');
    expect(state.user?.email).toBe('juan@example.com');
    expect(state.user?.rol?.nombre).toBe('CLIENTE');
  });

  it('setTokens renueva el par de tokens', () => {
    useAuthStore.getState().login(jwtResponse);
    useAuthStore.getState().setTokens('nuevo-access', 'nuevo-refresh');
    expect(useAuthStore.getState().token).toBe('nuevo-access');
    expect(useAuthStore.getState().refreshToken).toBe('nuevo-refresh');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logout limpia sesión', () => {
    useAuthStore.getState().login(jwtResponse);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
