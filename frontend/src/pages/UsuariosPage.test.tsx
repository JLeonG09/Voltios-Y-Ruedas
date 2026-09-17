import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { UsuariosPage } from './UsuariosPage';
import { useAuthStore } from '../store/authStore';
import type { Usuario } from '../types';

const usuarioConRol = (id: number, nombreRol: string, rolId: number): Usuario => ({
  id,
  nombre: 'N',
  apellido: 'A',
  email: `${nombreRol.toLowerCase()}@taller.com`,
  activo: true,
  fechaCreacion: '',
  fechaActualizacion: '',
  rol: { id: rolId, nombre: nombreRol },
  nombreCompleto: `N A ${nombreRol}`,
});

vi.mock('../services/usuarioService', () => ({
  usuarioService: {
    listar: vi.fn(),
    listarTodos: vi.fn(),
  },
}));

import { usuarioService } from '../services/usuarioService';

describe('UsuariosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      token: 't',
      refreshToken: 'r',
      user: usuarioConRol(10, 'ADMIN', 7),
    });
    vi.mocked(usuarioService.listar).mockResolvedValue({ content: [], totalElements: 0 });
    vi.mocked(usuarioService.listarTodos).mockResolvedValue([
      usuarioConRol(1, 'ADMIN', 7),
      usuarioConRol(2, 'CLIENTE', 99),
      usuarioConRol(3, 'MECANICO', 42),
    ]);
  });

  it('arma el select de roles con ids del API, no 1/2/3/4 fijos', async () => {
    render(<UsuariosPage />);
    await waitFor(() => {
      expect(usuarioService.listarTodos).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));

    const select = await screen.findByLabelText('Rol *');
    await waitFor(() => {
      expect(within(select).getByRole('option', { name: 'CLIENTE' })).toHaveValue('99');
    });

    const valores = Array.from(select.querySelectorAll('option'))
      .map((opt) => (opt as HTMLOptionElement).value)
      .filter((v) => v !== '');

    expect(valores).toEqual(expect.arrayContaining(['7', '99', '42']));
    expect(valores).not.toContain('1');
    expect(valores).not.toContain('2');
    expect(valores).not.toContain('3');
    expect(valores).not.toContain('4');
    expect(within(select).getByRole('option', { name: 'MECANICO' })).toHaveValue('42');
    expect(within(select).getByRole('option', { name: 'ADMIN' })).toHaveValue('7');
  });
});
