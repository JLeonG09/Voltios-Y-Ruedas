import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/authService', () => ({
  authService: {
    reestablecerPassword: vi.fn().mockResolvedValue(undefined),
  },
}));

import ReestablecerPasswordPage from './ReestablecerPasswordPage';

const renderPage = (token?: string) =>
  render(
    <MemoryRouter
      initialEntries={[
        token
          ? `/reestablecer-password/${encodeURIComponent(token)}`
          : '/reestablecer-password',
      ]}
    >
      <Routes>
        <Route path="/reestablecer-password" element={<ReestablecerPasswordPage />} />
        <Route path="/reestablecer-password/:token" element={<ReestablecerPasswordPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ReestablecerPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra enlace inválido cuando no hay token', () => {
    renderPage();
    expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
    expect(screen.getByText('Solicitar nuevo enlace')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nueva contraseña')).not.toBeInTheDocument();
  });

  it('muestra el formulario cuando hay token', () => {
    renderPage('abc123');
    expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
  });

  it('envía token y nueva contraseña y muestra la confirmación', async () => {
    renderPage('abc123');
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'nuevaPass123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'nuevaPass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    await waitFor(() => {
      expect(screen.getByText('Contraseña restablecida')).toBeInTheDocument();
    });

    const { authService } = await import('../services/authService');
    expect(authService.reestablecerPassword).toHaveBeenCalledWith({
      token: 'abc123',
      nuevaPassword: 'nuevaPass123',
    });
  });

  it('muestra error de validación cuando las contraseñas no coinciden', async () => {
    renderPage('abc123');
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: 'nuevaPass123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'otraPass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });
  });

  it('muestra error de validación con contraseña corta', async () => {
    renderPage('abc123');
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    await waitFor(() => {
      expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    });
  });
});
