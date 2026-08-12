import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/authService', () => ({
  authService: {
    recuperarPassword: vi.fn().mockResolvedValue(undefined),
  },
}));

import RecuperarPasswordPage from './RecuperarPasswordPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <RecuperarPasswordPage />
    </MemoryRouter>
  );

describe('RecuperarPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el formulario de recuperación', () => {
    renderPage();
    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
  });

  it('envía el email y muestra la confirmación', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'juan@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar instrucciones' }));

    await waitFor(() => {
      expect(screen.getByText('Revisa tu correo')).toBeInTheDocument();
    });
  });

  it('muestra error de validación con email vacío', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar instrucciones' }));
    await waitFor(() => {
      expect(screen.getByText('El email es obligatorio')).toBeInTheDocument();
    });
  });
});
