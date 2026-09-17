import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { JwtResponse } from '../types';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

import { authService } from '../services/authService';
import { LoginPage } from './LoginPage';

const jwt = (rol: string): JwtResponse => ({
  token: 't',
  tipo: 'Bearer',
  id: 1,
  nombre: 'Test',
  apellido: 'User',
  email: 'test@taller.com',
  rol,
  refreshToken: 'r',
});

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Destino staff</div>} />
        <Route path="/mi-vehiculo" element={<div>Destino cliente</div>} />
      </Routes>
    </MemoryRouter>
  );

const enviarLogin = () => {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'test@taller.com' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'secreto123' },
  });
  fireEvent.click(screen.getByRole('button', { name: /iniciar sesión|ingresando/i }));
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('CLIENTE entra a /mi-vehiculo, no a /dashboard', async () => {
    vi.mocked(authService.login).mockResolvedValue(jwt('CLIENTE'));
    renderLogin();
    expect(screen.getByText('Voltios y Ruedas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    enviarLogin();
    await waitFor(() => {
      expect(screen.getByText('Destino cliente')).toBeInTheDocument();
    });
    expect(screen.queryByText('Destino staff')).not.toBeInTheDocument();
  });

  it('muestra error de API en el formulario', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Credenciales inválidas'));
    renderLogin();
    enviarLogin();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas');
    });
    expect(screen.queryByText('Destino staff')).not.toBeInTheDocument();
    expect(screen.queryByText('Destino cliente')).not.toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('muestra fallback genérico si el error no trae mensaje', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error(''));
    renderLogin();
    enviarLogin();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudo iniciar sesión. Revisá email y contraseña.',
      );
    });
  });

  it('muestra error de red sin inventar usuario inexistente', async () => {
    vi.mocked(authService.login).mockRejectedValue(
      new Error('No se pudo conectar con el servidor. Revisá tu conexión o intentá más tarde.'),
    );
    renderLogin();
    enviarLogin();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/No se pudo conectar con el servidor/);
    });
    expect(screen.queryByText(/usuario no existe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/contraseña incorrecta/i)).not.toBeInTheDocument();
  });

  it('MECANICO entra a /dashboard', async () => {
    vi.mocked(authService.login).mockResolvedValue(jwt('MECANICO'));
    renderLogin();
    enviarLogin();
    await waitFor(() => {
      expect(screen.getByText('Destino staff')).toBeInTheDocument();
    });
    expect(screen.queryByText('Destino cliente')).not.toBeInTheDocument();
  });
});
