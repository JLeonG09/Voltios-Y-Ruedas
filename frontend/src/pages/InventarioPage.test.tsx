import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InventarioPage } from './InventarioPage';
import { useAuthStore } from '../store/authStore';

vi.mock('../services/inventarioService', () => ({
  inventarioService: {
    listar: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  },
}));

describe('InventarioPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 't',
      refreshToken: 'r',
      user: {
        id: 1,
        nombre: 'Jefe',
        apellido: 'Taller',
        email: 'jefe@taller.com',
        activo: true,
        fechaCreacion: '',
        fechaActualizacion: '',
        rol: { id: 2, nombre: 'JEFE_TALLER' },
      },
    });
  });

  it('no muestra Importar/Exportar (no hay endpoints en API)', async () => {
    render(<InventarioPage />);
    await waitFor(() => {
      expect(screen.getByText('Inventario')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /exportar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /importar/i })).not.toBeInTheDocument();
  });
});
