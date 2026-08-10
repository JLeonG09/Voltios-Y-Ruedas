import { api } from './api';
import type { Usuario, UsuarioResponse } from '../types';

export const usuarioService = {
  listar: async (page = 0, size = 10): Promise<{ content: Usuario[]; totalElements: number }> => {
    const response = await api.get<{ content: Usuario[]; totalElements: number }>('/usuarios', {
      page,
      size,
      sort: 'nombre,asc',
    });
    return response.data;
  },

  listarTodos: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>('/usuarios/todos');
    return response.data;
  },

  obtenerMecanicos: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>('/usuarios/mecanicos');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<Usuario> => {
    const response = await api.get<Usuario>(`/usuarios/${id}`);
    return response.data;
  },

  crear: async (data: Partial<Usuario> & { password: string; rolId: number }): Promise<Usuario> => {
    const response = await api.post<Usuario>('/usuarios', data);
    return response.data;
  },

  actualizar: async (id: number, data: Partial<Usuario>): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/usuarios/${id}`, data);
    return response.data;
  },

  cambiarPassword: async (id: number, passwordActual: string, passwordNuevo: string): Promise<void> => {
    await api.put(`/usuarios/${id}/password`, null, {
      params: { passwordActual, passwordNuevo },
    });
  },

  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  },
};