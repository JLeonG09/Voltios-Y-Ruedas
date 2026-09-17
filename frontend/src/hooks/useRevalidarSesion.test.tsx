import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuthStore } from '../store/authStore';
import type { UsuarioResponse } from '../types';

vi.mock('../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

import { authService } from '../services/authService';
import { useRevalidarSesion } from './useRevalidarSesion';

const usuarioMe: UsuarioResponse = {
  id: 9,
  nombre: 'Ana',
  apellido: 'Mecánica',
  email: 'ana@taller.com',
  activo: true,
  fechaCreacion: '2026-01-01',
  fechaActualizacion: '2026-01-01',
  rol: { id: 3, nombre: 'MECANICO' },
};

const Probe = () => {
  const { sesionLista, errorSesion, reintentar } = useRevalidarSesion();
  const rol = useAuthStore((s) => s.user?.rol?.nombre);
  return (
    <div>
      <span>{sesionLista ? 'lista' : 'cargando'}</span>
      {errorSesion && <span>error-sesion</span>}
      {rol && <span>rol:{rol}</span>}
      <button type="button" onClick={() => void reintentar()}>
        Reintentar
      </button>
    </div>
  );
};

describe('useRevalidarSesion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('no llama /me si no hay sesión persistida', async () => {
    render(<Probe />);
    await waitFor(() => {
      expect(screen.getByText('lista')).toBeInTheDocument();
    });
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('reemplaza el rol persistido con GET /api/auth/me', async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue(usuarioMe);
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'stale-token',
      refreshToken: 'stale-refresh',
      user: {
        ...usuarioMe,
        rol: { id: 1, nombre: 'ADMIN' },
      },
    });

    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText('rol:MECANICO')).toBeInTheDocument();
    });
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.rol?.nombre).toBe('MECANICO');
  });

  it('muestra error recuperable si /me falla y la sesión sigue activa', async () => {
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('red caida'));
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'token',
      refreshToken: 'refresh',
      user: usuarioMe,
    });

    render(<Probe />);

    await waitFor(() => {
      expect(screen.getByText('error-sesion')).toBeInTheDocument();
    });
    expect(screen.queryByText('lista')).not.toBeInTheDocument();
  });

  it('reintenta /me desde el estado de error', async () => {
    vi.mocked(authService.getCurrentUser)
      .mockRejectedValueOnce(new Error('red caida'))
      .mockResolvedValueOnce(usuarioMe);
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'token',
      refreshToken: 'refresh',
      user: { ...usuarioMe, rol: { id: 1, nombre: 'ADMIN' } },
    });

    render(<Probe />);
    await waitFor(() => {
      expect(screen.getByText('error-sesion')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => {
      expect(screen.getByText('rol:MECANICO')).toBeInTheDocument();
      expect(screen.getByText('lista')).toBeInTheDocument();
    });
  });
});
